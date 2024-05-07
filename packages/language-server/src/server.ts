import { Snapshot } from "@knuckles/analyzer";
import {
  defaultConfig,
  discoverConfigFile,
  readConfigFile,
} from "@knuckles/config";
import { Position, Range } from "@knuckles/location";
import { Transpiler } from "@knuckles/typescript";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  type SourceFile,
  type DefinitionInfo,
  type LanguageService,
  type TypeChecker,
} from "ts-morph";
import * as ts from "typescript/lib/tsserverlibrary.js";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  type Connection,
  createConnection,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
  type TextDocumentIdentifier,
  type Location,
  Range as VSCodeRange,
  Position as VSCodePosition,
  type CompletionItem,
} from "vscode-languageserver/node.js";

const UPDATE_DEBOUNCE = 1000;

export interface LanguageServerOptions {
  connection?: Connection;
}

class SharedResourcesProvider {
  async getConfig(path: string) {
    const koConfigFilePath = await discoverConfigFile(path);
    const koConfig = koConfigFilePath
      ? await readConfigFile(koConfigFilePath)
      : defaultConfig;
    return koConfig;
  }

  getTranspiler(path: string) {
    const tsConfigFilePath = ts.findConfigFile(path, ts.sys.fileExists);

    const transpiler = new Transpiler({
      tsConfig: tsConfigFilePath,
    });

    return transpiler;
  }
}

interface DocumentState {
  snapshot: Snapshot;
  sourceFile: SourceFile;
  service: LanguageService;
  document: TextDocument;
  checker: TypeChecker;
}

interface DocumentStateProvider {
  getState(): Promise<DocumentState>;
  onChange(): void;
  dispose(): void;
}

async function updateDocumentState(
  provider: SharedResourcesProvider,
  document: TextDocument,
): Promise<DocumentState> {
  const path = fileURLToPath(document.uri);
  const original = document.getText();

  const config = await provider.getConfig(path);

  const transpiler = provider.getTranspiler(path);
  const { generated, sourceMap, sourceFile } = transpiler.transpile(
    path,
    original,
    config.analyzer.mode,
  );

  const snapshot = await new Snapshot({
    fileName: path,
    original,
    generated,
    sourceMap,
  });

  const project = sourceFile.getProject();
  const service = project.getLanguageService();
  const checker = project.getTypeChecker();

  return {
    document,
    snapshot,
    sourceFile,
    service,
    checker,
  };
}

function createDocumentStateProvider(
  provider: SharedResourcesProvider,
  document: TextDocument,
): DocumentStateProvider {
  let statePromise = updateDocumentState(provider, document);

  const onChange = createDebounce(() => {
    statePromise = updateDocumentState(provider, document);
  }, UPDATE_DEBOUNCE);

  const documentStateProvider: DocumentStateProvider = {
    getState: () => {
      return statePromise;
    },

    onChange,

    dispose: () => {
      onChange.cancel();
    },
  };

  return documentStateProvider;
}

interface Debounce {
  (): void;
  cancel(): void;
}

function createDebounce(callback: () => void, timeout: number): Debounce {
  let id: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => clearTimeout(id);

  return Object.assign(
    () => {
      cancel();
      id = setTimeout(callback, timeout);
    },
    {
      cancel,
    },
  );
}

export function startLanguageServer(options?: LanguageServerOptions) {
  const connection =
    options?.connection ?? createConnection(ProposedFeatures.all);
  const documents = new TextDocuments(TextDocument);

  const sharedResourcesProvider = new SharedResourcesProvider();
  const snapshotProviderMap = new WeakMap<
    TextDocument,
    DocumentStateProvider
  >();

  const getDocumentState = (documentId: TextDocumentIdentifier) => {
    const document = documents.get(documentId.uri)!;
    const provider = createDocumentStateProvider(
      sharedResourcesProvider,
      document,
    );
    return provider.getState();
  };

  documents.onDidOpen(async (event) => {
    const provider = createDocumentStateProvider(
      sharedResourcesProvider,
      event.document,
    );
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
        textDocumentSync: TextDocumentSyncKind.Incremental,
        definitionProvider: true,
        hoverProvider: true,
        completionProvider: {},
      },
    };
  });

  connection.onDefinition(async (params) => {
    const state = await getDocumentState(params.textDocument);

    const originalPosition = Position.fromLineAndColumn(
      params.position.line,
      params.position.character,
      state.snapshot.original,
    );
    const generatedPosition =
      state.snapshot.getGeneratedPosition(originalPosition);

    if (generatedPosition) {
      const definitions = state.service.getDefinitionsAtPosition(
        state.sourceFile,
        generatedPosition.offset,
      );

      return definitions.flatMap((definition): Location[] => {
        const node = definition.getNode();

        const definitionToLocation = (definition: DefinitionInfo): Location => {
          const sourceFile = definition.getSourceFile();
          const path = sourceFile.getFilePath();
          const uri = pathToFileURL(path).toString();
          const span = definition.getTextSpan();
          const range1 = Range.fromOffset(
            span.getStart(),
            span.getEnd(),
            sourceFile.getFullText(),
          );
          const range2 = VSCodeRange.create(
            VSCodePosition.create(range1.start.line, range1.start.column),
            VSCodePosition.create(range1.end.line, range1.end.column),
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
          const originalPosition =
            state.snapshot.getOriginalPosition(generatedPosition);

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
                range: VSCodeRange.create(
                  VSCodePosition.create(range.start.line, range.start.column),
                  VSCodePosition.create(range.end.line, range.end.column),
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

  connection.onHover(async (params) => {
    const state = await getDocumentState(params.textDocument);

    const originalPosition = Position.fromLineAndColumn(
      params.position.line,
      params.position.character,
      state.snapshot.original,
    );
    const generatedPosition =
      state.snapshot.getGeneratedPosition(originalPosition);

    if (generatedPosition) {
      let quickInfo: ts.QuickInfo | undefined;

      const [definition] = state.service.getDefinitionsAtPosition(
        state.sourceFile,
        generatedPosition.offset,
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
          const originalPosition =
            state.snapshot.getOriginalPosition(generatedPosition);

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
        generatedPosition.offset,
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

  connection.onCompletion(async (params) => {
    const state = await getDocumentState(params.textDocument);

    const originalPosition = Position.fromLineAndColumn(
      params.position.line,
      params.position.character,
      state.snapshot.original,
    );
    const generatedPosition =
      state.snapshot.getGeneratedPosition(originalPosition);

    if (generatedPosition) {
      const completions = state.service.compilerObject.getCompletionsAtPosition(
        state.sourceFile.getFilePath(),
        generatedPosition.offset,
        {},
      );

      if (completions) {
        return completions.entries.map((entry): CompletionItem => {
          return {
            label: entry.name,
          };
        });
      }
    }

    return null;
  });

  documents.listen(connection);
  connection.listen();

  connection.console.log("Listening...");
}
