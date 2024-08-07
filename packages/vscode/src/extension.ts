import { createDebounceAsync } from "./utils/debounce.js";
import { isMatchingReference } from "./utils/diagnostics.js";
import { LogLevel, Logger } from "@eliassko/logger";
import {
  LanguageService,
  type DiagnosticIdentifier,
  type LanguageServiceOptions,
} from "@knuckles/language-service";
import { join } from "node:path";
import * as vscode from "vscode";

let service: LanguageService | undefined;

const DEBOUNCE_RATE = 1000;

export function activate(context: vscode.ExtensionContext) {
  const options = {
    selector: {
      scheme: "file",
      language: "html",
    },
    completion: {
      triggerCharacters: [".", '"', "'", "`", "/", "@", "<", "#", " "],
      commitCharacters: [".", ",", ";", ")"],
    },
    diagnostics: {
      debounce: 1000,
    },
    debug: {
      // Warning! Disabling this will run the language service on the same
      // thread as vscode.
      worker: false,
    },
  };

  //#region logging
  const outputChannel = vscode.window.createOutputChannel(
    "Knuckles Language Service",
    { log: true },
  );
  const logger = new Logger();
  logger.onLog((log) => {
    switch (log.level) {
      case LogLevel.Error:
        outputChannel.error(log.text);
        break;
      case LogLevel.Warning:
        outputChannel.warn(log.text);
        break;
      case LogLevel.Info:
        outputChannel.info(log.text);
        break;
      case LogLevel.Verbose:
        outputChannel.debug(log.text);
        break;
      case LogLevel.Debug:
        outputChannel.trace(log.text);
        break;
    }
  });
  //#endregion

  //#region language service
  const serviceOptions: LanguageServiceOptions = {
    worker: options.debug.worker,
    workerURL: join(__dirname, "worker.js"),
    logger,
  };

  logger.info("Starting language service.");
  service = new LanguageService(serviceOptions);
  //#endregion

  //#region text document
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      if (!service) return;
      if (!vscode.languages.match(options.selector, document)) return;
      getLatestUpdate(document);
      updateDiagnostics(document);
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (!service) return;
      if (event.contentChanges.length === 0) return;
      if (!vscode.languages.match(options.selector, event.document)) return;
      getLatestUpdate(event.document);
      updateDiagnostics(event.document);
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((document) => {
      if (!service) return;
      if (!vscode.languages.match(options.selector, document)) return;
      service.closeDocument(document.fileName);
    }),
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
      if (!service) return;
      if (editor) {
        if (!vscode.languages.match(options.selector, editor.document)) return;
        await service.openDocument(
          editor.document.fileName,
          editor.document.getText(),
        );
      }
    }),
  );
  //#endregion

  //#region updates
  const documentVersionMap = new Map<string, number>();
  const debounceUpdateMap = new Map<string, () => Promise<void>>();

  async function update(document: vscode.TextDocument) {
    if (!service) return;
    await service.editDocument(document.fileName, document.getText());
    logger.debug("Document is updated!");
  }

  function getDebouncedUpdate(document: vscode.TextDocument) {
    let debounce = debounceUpdateMap.get(document.uri.toString());
    if (debounce) return debounce;

    debounce = createDebounceAsync(() => update(document), DEBOUNCE_RATE);
    debounceUpdateMap.set(document.uri.toString(), debounce);
    return debounce;
  }

  async function getLatestUpdate(document: vscode.TextDocument) {
    if (!service) return false;

    const currentVersion = document.version;

    // Check if the version is actually outdated.
    const cached = documentVersionMap.get(document.uri.toString());
    if (cached === currentVersion) return true;

    const debounced = getDebouncedUpdate(document);
    await debounced();

    documentVersionMap.set(document.uri.toString(), document.version);

    return document.version === currentVersion;
  }
  //#endregion

  //#region code actions
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(options.selector, {
      async provideCodeActions(document, range, context, token) {
        if (!service) return null;
        if (!(await getLatestUpdate(document))) return null;
        if (token.isCancellationRequested) return null;

        const codeActions = await service.getCodeActions({
          fileName: document.fileName,
          position: {
            line: range.start.line,
            column: range.start.character,
          },
          diagnostics: context.diagnostics
            .filter(
              (d): d is typeof d & { code: string } =>
                Boolean(d.code) && typeof d.code === "string",
            )
            .map((diagnostic) => ({
              code: diagnostic.code,
              range: {
                start: {
                  line: diagnostic.range.start.line,
                  column: diagnostic.range.start.character,
                },
                end: {
                  line: diagnostic.range.end.line,
                  column: diagnostic.range.end.character,
                },
              },
            })),
        });

        if (token.isCancellationRequested) return null;

        return codeActions.map((fix): vscode.CodeAction => {
          const workspaceEdit = new vscode.WorkspaceEdit();

          for (const edit of fix.edits) {
            switch (edit.type) {
              case "delete":
                workspaceEdit.delete(
                  vscode.Uri.file(edit.fileName),
                  new vscode.Range(
                    new vscode.Position(
                      edit.range.start.line,
                      edit.range.start.column,
                    ),
                    new vscode.Position(
                      edit.range.end.line,
                      edit.range.end.column,
                    ),
                  ),
                );
                break;

              case "replace":
                workspaceEdit.replace(
                  vscode.Uri.file(edit.fileName),
                  new vscode.Range(
                    new vscode.Position(
                      edit.range.start.line,
                      edit.range.start.column,
                    ),
                    new vscode.Position(
                      edit.range.end.line,
                      edit.range.end.column,
                    ),
                  ),
                  edit.text,
                );
                break;

              case "insert":
                workspaceEdit.insert(
                  vscode.Uri.file(edit.fileName),
                  new vscode.Position(edit.position.line, edit.position.column),
                  edit.text,
                );
                break;

              case "create-file":
                workspaceEdit.createFile(vscode.Uri.file(edit.fileName));
                break;

              case "delete-file":
                workspaceEdit.deleteFile(vscode.Uri.file(edit.fileName));
                break;

              case "rename-file":
                workspaceEdit.renameFile(
                  vscode.Uri.file(edit.oldFileName),
                  vscode.Uri.file(edit.newFileName),
                );
                break;
            }
          }

          const diagnosticId = fix.diagnostic;
          const diagnostic = diagnosticId
            ? context.diagnostics.find((d) =>
                isMatchingReference(d, diagnosticId),
              )
            : undefined;

          return {
            title: fix.label,
            edit: workspaceEdit,

            // TODO: allow language service to return multiple diagnostics
            diagnostics: diagnostic ? [diagnostic] : [],

            // TODO: move to language service
            kind: vscode.CodeActionKind.QuickFix,
            isPreferred: true,

            command: {
              title: "Fix this issue (command)",
              command: "_knuckles.quickFix",
              arguments: [document.uri.toString(), fix.diagnostic],
            },
          };
        });
      },
    }),
  );
  //#endregion code action

  //#region completion
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      options.selector,
      {
        async provideCompletionItems(document, position, token, context) {
          if (!service) return null;
          if (!(await getLatestUpdate(document))) return null;

          if (token.isCancellationRequested) {
            return null;
          }

          const items = await service.getCompletion({
            fileName: document.fileName,
            position: {
              line: position.line,
              column: position.character,
            },
            context: {
              triggerCharacter: context.triggerCharacter,
              triggerKind: context.triggerKind as number,
            },
          });

          if (token.isCancellationRequested) {
            return null;
          }

          return items.map(
            (item): vscode.CompletionItem => ({
              label: item.label,
              kind: item.kind as number,
              preselect: item.preselect,
              insertText: item.insertText,
              filterText: item.filterText,
              sortText: item.sortText,
              commitCharacters: options.completion.commitCharacters,
            }),
          );
        },
      },
      ...options.completion.triggerCharacters,
    ),
  );
  //#endregion

  //#region go to definition
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(options.selector, {
      async provideDefinition(document, position, token) {
        if (!service) return null;
        if (!(await getLatestUpdate(document))) return null;

        if (token.isCancellationRequested) {
          return null;
        }

        const definition = await service.getDefinition({
          fileName: document.fileName,
          position: {
            line: position.line,
            column: position.character,
          },
        });

        if (token.isCancellationRequested) {
          return null;
        }

        return definition.map(
          (location): vscode.Location => ({
            uri: vscode.Uri.file(location.path),
            range: new vscode.Range(
              new vscode.Position(
                location.range.start.line,
                location.range.start.column,
              ),
              new vscode.Position(
                location.range.end.line,
                location.range.end.column,
              ),
            ),
          }),
        );
      },
    }),
  );
  //#endregion

  //#region diagnostics
  async function getDiagnostics(document: vscode.TextDocument) {
    if (!service) return null;
    if (!(await getLatestUpdate(document))) return null;

    const diagnostics = await service.getDiagnostics({
      fileName: document.fileName,
    });

    return diagnostics.map(
      (diagnostic): vscode.Diagnostic => ({
        message: diagnostic.message,
        range: new vscode.Range(
          new vscode.Position(
            diagnostic.range.start.line,
            diagnostic.range.start.column,
          ),
          new vscode.Position(
            diagnostic.range.end.line,
            diagnostic.range.end.column,
          ),
        ),
        severity: diagnostic.severity as number,
        code: diagnostic.code,
        source: diagnostic.source,
      }),
    );
  }
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("knuckles");
  async function updateDiagnostics(document: vscode.TextDocument) {
    const originalVersion = document.version;
    const diagnostics = (await getDiagnostics(document)) ?? [];

    logger.debug(`Found ${diagnostics.length} diagnostics.`);

    // Avoid updating diagnostics in document while it is being edited.
    if (originalVersion !== document.version) return;

    logger.debug("Updated diagnostics.");

    diagnosticCollection.set(document.uri, diagnostics);
  }
  //#endregion

  //#region hover
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(options.selector, {
      async provideHover(document, position, token) {
        if (!service) return null;
        if (!(await getLatestUpdate(document))) return null;

        if (token.isCancellationRequested) {
          return null;
        }

        const hover = await service.getHover({
          fileName: document.fileName,
          position: {
            line: position.line,
            column: position.character,
          },
        });

        if (token.isCancellationRequested) {
          return null;
        }

        if (!hover) {
          return null;
        }

        const content = new vscode.MarkdownString(hover.documentation);
        content.isTrusted = true;

        return {
          contents: [content],
        };
      },
    }),
  );
  //#endregion

  //#region internal commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "_knuckles.openJsDocLink",
      async (fileName, start, length) => {
        const document = await vscode.workspace.openTextDocument(fileName);
        await vscode.window.showTextDocument(document, {
          selection: new vscode.Selection(
            document.positionAt(start),
            document.positionAt(start + length),
          ),
        });
      },
    ),
  );

  // Remove diagnostics immediately when using quick-fixes.
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "_knuckles.quickFix",
      async (documentUri: string, diagnosticId: DiagnosticIdentifier) => {
        const uri = vscode.Uri.parse(documentUri);
        const filteredDiagnostics =
          diagnosticCollection
            .get(uri)
            ?.filter((d) => !isMatchingReference(d, diagnosticId)) ?? [];
        diagnosticCollection.set(uri, filteredDiagnostics);
      },
    ),
  );
  //#endregion

  //#region public commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "knuckles.restartLanguageService",
      async () => {
        if (service) {
          logger.info("Gracefully stopping previous language service.");
          try {
            await service.stop();
          } catch {}
          logger.info("Restarting language service.");
          service = new LanguageService(serviceOptions);
        }
      },
    ),
  );
  //#endregion
}

export async function deactivate() {
  await service?.stop();
}
