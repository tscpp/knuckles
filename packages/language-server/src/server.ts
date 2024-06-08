import type { Snapshot } from "../../fabricator/src/snapshot.js";
import { createAsyncDebounce } from "./utils/debounce.js";
import {
  Analyzer,
  AnalyzerSeverity,
  parserErrorToAnalyzerIssue,
  type AnalyzerIssue,
} from "@knuckles/analyzer";
import {
  defaultConfig,
  discoverConfigFile,
  readConfigFile,
  type NormalizedConfig,
} from "@knuckles/config";
import { Position, Range } from "@knuckles/location";
import { parse } from "@knuckles/parser";
import { Transpiler } from "@knuckles/typescript";
import analyzerTypeScriptPlugin from "@knuckles/typescript/analyzer";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  type SourceFile,
  type DefinitionInfo,
  type LanguageService,
  type TypeChecker,
} from "ts-morph";
import * as ts from "typescript/lib/tsserverlibrary.js";
import { TextDocument } from "vscode-languageserver-textdocument";
import * as vscode from "vscode-languageserver/node.js";

const UPDATE_DEBOUNCE = 500;

export interface LanguageServerOptions {
  connection?: vscode.Connection;
}

enum DocumentStatus {
  Broken,
  Complete,
}

type DocumentState =
  | {
      status: DocumentStatus.Broken;
      snapshot?: undefined;
      sourceFile?: undefined;
      service?: undefined;
      document?: undefined;
      checker?: undefined;
    }
  | {
      status: DocumentStatus.Complete;
      snapshot: Snapshot;
      sourceFile: SourceFile;
      service: LanguageService;
      document: TextDocument;
      checker: TypeChecker;
    };

interface DocumentStateProvider {
  getState(): Promise<DocumentState>;
  onChange(): void;
  dispose(): void;
}

interface SharedResourcesProvider {
  getAnalyzer(path: string): Promise<Analyzer>;
  getConfig(path: string): Promise<NormalizedConfig>;
  getTranspiler(path: string): Promise<Transpiler>;
  close(path: string): void;
}

export function startLanguageServer(options?: LanguageServerOptions) {
  //#region Initialize
  const connection =
    options?.connection ?? vscode.createConnection(vscode.ProposedFeatures.all);
  const documents = new vscode.TextDocuments(TextDocument);

  const sharedResourcesProvider = createSharedResourcesProvider();
  const snapshotProviderMap = new WeakMap<
    TextDocument,
    DocumentStateProvider
  >();

  const getDocumentState = (documentId: vscode.TextDocumentIdentifier) => {
    const document = documents.get(documentId.uri);
    assert(document);
    const provider = snapshotProviderMap.get(document);
    assert(provider);
    return provider.getState();
  };

  documents.onDidOpen(async (event) => {
    const provider = createDocumentStateProvider(event.document);
    snapshotProviderMap.set(event.document, provider);
  });

  documents.onDidChangeContent(async (event) => {
    const provider = snapshotProviderMap.get(event.document);
    provider?.onChange();
  });

  documents.onDidClose((event) => {
    const provider = snapshotProviderMap.get(event.document);
    provider?.dispose();
    snapshotProviderMap.delete(event.document);
  });

  connection.onInitialize(() => {
    return {
      capabilities: {
        textDocumentSync: vscode.TextDocumentSyncKind.Incremental,
        definitionProvider: true,
        hoverProvider: true,
        completionProvider: {
          resolveProvider: false,
          triggerCharacters: [".", '"', "'", "`", "/", "@", "<", "#", " "],
          allCommitCharacters: [".", ",", ";", ")"],
        },
      },
    };
  });
  //#endregion

  //#region Definition
  connection.onDefinition(async (params) => {
    const state = await getDocumentState(params.textDocument);

    if (state.status === DocumentStatus.Broken) {
      return [];
    }

    const originalPosition = Position.fromLineAndColumn(
      params.position.line,
      params.position.character,
      state.snapshot.original,
    );
    const generatedPosition = state.snapshot.mirror({
      original: originalPosition,
    });

    if (generatedPosition) {
      const definitions = state.service.getDefinitionsAtPosition(
        state.sourceFile,
        generatedPosition.offset,
      );

      return definitions.flatMap((definition): vscode.Location[] => {
        const node = definition.getNode();

        const definitionToLocation = (
          definition: DefinitionInfo,
        ): vscode.Location => {
          const sourceFile = definition.getSourceFile();
          const path = sourceFile.getFilePath();
          const uri = pathToFileURL(path).toString();
          const span = definition.getTextSpan();
          const range1 = Range.fromOffsets(
            span.getStart(),
            span.getEnd(),
            sourceFile.getFullText(),
          );
          const range2 = vscode.Range.create(
            vscode.Position.create(range1.start.line, range1.start.column),
            vscode.Position.create(range1.end.line, range1.end.column),
          );

          return {
            uri: uri,
            range: range2,
          };
        };

        if (
          node.getSourceFile().getFilePath() === state.sourceFile.getFilePath()
        ) {
          const generatedStartOffset = node.getStart();
          const generatedPosition = Position.fromOffset(
            generatedStartOffset,
            state.snapshot.generated,
          );
          const originalPosition = state.snapshot.mirror({
            generated: generatedPosition,
          });

          if (originalPosition) {
            const generatedEndOffset = node.getEnd();
            // TODO: don't assume the original length is the same as the generated.
            const length = generatedEndOffset - generatedStartOffset;
            const range = new Range(
              originalPosition,
              Position.fromOffset(
                originalPosition.offset + length,
                state.snapshot.original,
              ),
            );
            return [
              {
                uri: state.document.uri,
                range: vscode.Range.create(
                  vscode.Position.create(range.start.line, range.start.column),
                  vscode.Position.create(range.end.line, range.end.column),
                ),
              },
            ];
          } else {
            const definitions = state.service.getDefinitions(node);
            return definitions.map((definition) =>
              definitionToLocation(definition),
            );
          }
        } else {
          return [definitionToLocation(definition)];
        }
      });
    } else {
      return [];
    }
  });
  //#endregion

  //#region Hover
  connection.onHover(async (params) => {
    const state = await getDocumentState(params.textDocument);

    if (state.status === DocumentStatus.Broken) {
      return null;
    }

    const originalPosition = Position.fromLineAndColumn(
      params.position.line,
      params.position.character,
      state.snapshot.original,
    );
    const generatedRange = state.snapshot.mirror({
      original: originalPosition,
    });

    if (generatedRange) {
      let quickInfo: ts.QuickInfo | undefined;

      const [definition] = state.service.getDefinitionsAtPosition(
        state.sourceFile,
        generatedRange.offset,
      );

      if (definition) {
        const node = definition.getNode();

        if (
          node.getSourceFile().getFilePath() === state.sourceFile.getFilePath()
        ) {
          const generatedStartOffset = node.getStart();
          const generatedPosition = Position.fromOffset(
            generatedStartOffset,
            state.snapshot.generated,
          );
          const originalPosition = state.snapshot.mirror({
            generated: generatedPosition,
          });

          if (!originalPosition) {
            const [definition] = state.service.getDefinitions(node);

            if (definition) {
              quickInfo = state.service.compilerObject.getQuickInfoAtPosition(
                definition.getSourceFile().getFilePath(),
                definition.getTextSpan().getStart(),
              );
            }
          }
        }
      }

      quickInfo ??= state.service.compilerObject.getQuickInfoAtPosition(
        state.sourceFile.getFilePath(),
        generatedRange.offset,
      );

      if (quickInfo) {
        return {
          contents: [
            ...(quickInfo.displayParts
              ? [
                  {
                    language: "typescript",
                    value: quickInfo.displayParts
                      .map((part) => part.text)
                      .join(""),
                  },
                ]
              : []),
          ],
        };
      }
    }

    return null;
  });
  //#endregion

  //#region Completion
  connection.onCompletion(async (params) => {
    const state = await getDocumentState(params.textDocument);

    if (state.status === DocumentStatus.Broken) {
      return null;
    }

    const originalPosition = Position.fromLineAndColumn(
      params.position.line,
      params.position.character,
      state.snapshot.original,
    );
    const generatedPosition = state.snapshot.mirror({
      original: originalPosition,
    });

    if (generatedPosition) {
      const completions = state.service.compilerObject.getCompletionsAtPosition(
        state.sourceFile.getFilePath(),
        generatedPosition.offset,
        {
          includeCompletionsForImportStatements: false,
          includeCompletionsForModuleExports: false,
          allowRenameOfImportPath: false,
          // TODO: get quote from current binding attribute
          quotePreference: "auto",
          triggerCharacter: params.context?.triggerCharacter as
            | ts.CompletionsTriggerCharacter
            | undefined,
          triggerKind: params.context?.triggerKind,
        },
      );

      if (completions) {
        return completions.entries.map((entry): vscode.CompletionItem => {
          // https://github.com/microsoft/vscode/blob/77e5788/extensions/typescript-language-features/src/languageFeatures/completions.ts#L440
          const convertKind = (kind: string): vscode.CompletionItemKind => {
            switch (kind) {
              case ts.ScriptElementKind.primitiveType:
              case ts.ScriptElementKind.keyword:
                return vscode.CompletionItemKind.Keyword;

              case ts.ScriptElementKind.constElement:
              case ts.ScriptElementKind.letElement:
              case ts.ScriptElementKind.variableElement:
              case ts.ScriptElementKind.localVariableElement:
              case ts.ScriptElementKind.alias:
              case ts.ScriptElementKind.parameterElement:
                return vscode.CompletionItemKind.Variable;

              case ts.ScriptElementKind.memberVariableElement:
              case ts.ScriptElementKind.memberGetAccessorElement:
              case ts.ScriptElementKind.memberSetAccessorElement:
                return vscode.CompletionItemKind.Field;

              case ts.ScriptElementKind.functionElement:
              case ts.ScriptElementKind.localFunctionElement:
                return vscode.CompletionItemKind.Function;

              case ts.ScriptElementKind.memberFunctionElement:
              case ts.ScriptElementKind.constructSignatureElement:
              case ts.ScriptElementKind.callSignatureElement:
              case ts.ScriptElementKind.indexSignatureElement:
                return vscode.CompletionItemKind.Method;

              case ts.ScriptElementKind.enumElement:
                return vscode.CompletionItemKind.Enum;

              case ts.ScriptElementKind.enumMemberElement:
                return vscode.CompletionItemKind.EnumMember;

              case ts.ScriptElementKind.moduleElement:
              case ts.ScriptElementKind.externalModuleName:
                return vscode.CompletionItemKind.Module;

              case ts.ScriptElementKind.classElement:
              case ts.ScriptElementKind.typeElement:
                return vscode.CompletionItemKind.Class;

              case ts.ScriptElementKind.interfaceElement:
                return vscode.CompletionItemKind.Interface;

              case ts.ScriptElementKind.warning:
                return vscode.CompletionItemKind.Text;

              case ts.ScriptElementKind.scriptElement:
                return vscode.CompletionItemKind.File;

              case ts.ScriptElementKind.directory:
                return vscode.CompletionItemKind.Folder;

              case ts.ScriptElementKind.string:
                return vscode.CompletionItemKind.Constant;

              default:
                return vscode.CompletionItemKind.Property;
            }
          };

          return {
            label: entry.name,
            kind: convertKind(entry.kind),
            preselect: entry.isRecommended,
            insertText: entry.insertText,
            filterText: entry.filterText,
            sortText: entry.sortText,
          };
        });
      }
    }

    return null;
  });
  //#endregion

  //#region Connect
  documents.listen(connection);
  connection.listen();

  connection.console.log("Listening...");
  //#endregion

  //#region Document State
  async function updateDocumentState(
    provider: SharedResourcesProvider,
    document: TextDocument,
  ): Promise<DocumentState> {
    const startTime = performance.now();

    const path = fileURLToPath(document.uri);
    const original = document.getText();

    const config = await provider.getConfig(path);

    const parseResult = parse(original);
    const parserDiagnostics = parseResult.errors.map((error) =>
      analyzerIssueToVscodeDiagnostic(
        parserErrorToAnalyzerIssue(error),
        original,
      ),
    );

    connection.sendDiagnostics({
      uri: document.uri,
      diagnostics: parserDiagnostics,
    });

    if (!parseResult.document) {
      return {
        status: DocumentStatus.Broken,
      };
    }

    const transpiler = await provider.getTranspiler(path);
    const { chunk, sourceFile } = transpiler.transpile(
      path,
      parseResult.document,
      config.analyzer.mode,
    );

    writeFileSync(path + ".generated.ts", sourceFile.getFullText(), "utf8");

    const snapshot = chunk.snapshot(original);

    const project = sourceFile.getProject();
    const service = project.getLanguageService();
    const checker = project.getTypeChecker();

    const analyzer = await provider.getAnalyzer(path);

    const result = await analyzer.analyze(path, original, {
      cache: {
        document: parseResult.document,
        snapshots: {
          typescript: snapshot,
        },
      },
    });

    connection.sendDiagnostics({
      uri: document.uri,
      diagnostics: result.issues
        .map((issue) => analyzerIssueToVscodeDiagnostic(issue, original))
        .concat(parserDiagnostics),
    });

    const endTime = performance.now();
    const deltaTime = endTime - startTime;
    console.log(`Analyze took ${deltaTime.toFixed(2)}ms`);

    return {
      status: DocumentStatus.Complete,
      document,
      snapshot,
      sourceFile,
      service,
      checker,
    };
  }

  function createDocumentStateProvider(
    document: TextDocument,
  ): DocumentStateProvider {
    const path = fileURLToPath(document.uri);

    let statePromise: Promise<DocumentState>;

    const onChange = createAsyncDebounce(async () => {
      statePromise = updateDocumentState(sharedResourcesProvider, document);
      await statePromise;
    }, UPDATE_DEBOUNCE);

    const documentStateProvider: DocumentStateProvider = {
      getState: () => {
        return statePromise;
      },

      onChange,

      dispose: () => {
        sharedResourcesProvider.close(path);
        onChange.cancel();
      },
    };

    return documentStateProvider;
  }

  function analyzerIssueToVscodeDiagnostic(
    issue: AnalyzerIssue,
    text: string,
  ): vscode.Diagnostic {
    const start = issue.start ?? Position.fromOffset(0, text);
    const end = issue.end ?? Position.fromOffset(start.offset + 1, text);
    const range = vscode.Range.create(
      vscode.Position.create(start.line, start.column),
      vscode.Position.create(end.line, end.column),
    );
    const severity = {
      [AnalyzerSeverity.Error]: vscode.DiagnosticSeverity.Error,
      [AnalyzerSeverity.Warning]: vscode.DiagnosticSeverity.Warning,
    }[issue.severity];
    return {
      range,
      severity,
      message: issue.message,
      source: "knuckles",
      code: issue.name,
    };
  }
  //#endregion

  //#region Shared Resources
  function createSharedResourcesProvider(): SharedResourcesProvider {
    const resolvedConfigPaths = new Map<string, string | null>();
    const projectConfigs = new Map<string | null, NormalizedConfig>();
    const projectAnalyzers = new Map<string | null, Analyzer>();
    const tsconfigToTranspiler = new Map<string | undefined, Transpiler>();

    const findConfig = async (path: string) => {
      if (resolvedConfigPaths.has(path)) {
        return resolvedConfigPaths.get(path)!;
      } else {
        const filePath = await discoverConfigFile(path);
        resolvedConfigPaths.set(path, filePath);
        return filePath;
      }
    };

    const readConfig = async (filePath: string | null) => {
      if (projectConfigs.has(filePath)) {
        return projectConfigs.get(filePath)!;
      } else {
        const config = filePath
          ? await readConfigFile(filePath)
          : defaultConfig;
        projectConfigs.set(filePath, config);
        return config;
      }
    };

    return {
      async getAnalyzer(path: string) {
        const configFilePath = await findConfig(path);
        const config = await readConfig(configFilePath);

        if (projectAnalyzers.has(configFilePath)) {
          return projectAnalyzers.get(configFilePath)!;
        } else {
          const hasTypeScriptPlugin = config.analyzer.plugins.some(
            (plugin) => plugin.name === "typescript",
          );

          const analyzer = new Analyzer({
            attributes: config.attributes,
            plugins: hasTypeScriptPlugin
              ? config.analyzer.plugins
              : [
                  await analyzerTypeScriptPlugin({
                    // TODO: resolve tsconfig
                    tsconfig: undefined,
                    mode: config.analyzer.mode,
                  }),
                  ...config.analyzer.plugins,
                ],
          });
          projectAnalyzers.set(configFilePath, analyzer);
          return analyzer;
        }
      },

      async getConfig(path: string) {
        const filePath = await findConfig(path);
        return await readConfig(filePath);
      },

      async getTranspiler(path: string) {
        const tsConfigFilePath = ts.findConfigFile(path, ts.sys.fileExists);

        let transpiler = tsconfigToTranspiler.get(tsConfigFilePath);

        if (!transpiler) {
          transpiler = new Transpiler({
            tsConfig: tsConfigFilePath,
          });
          tsconfigToTranspiler.set(tsConfigFilePath, transpiler);
        }

        return transpiler;
      },

      close(path: string) {
        if (resolvedConfigPaths.has(path)) {
          const configPath = resolvedConfigPaths.get(path)!;
          resolvedConfigPaths.delete(path);

          const isDangling = !Array.from(resolvedConfigPaths.values()).some(
            (value) => value === configPath,
          );

          if (isDangling) {
            if (projectAnalyzers.has(configPath)) {
              const analyzer = projectAnalyzers.get(configPath)!;
              analyzer.dispose();
              projectAnalyzers.delete(configPath);
            }
          }
        }
      },
    };
  }
  //#endregion
}
