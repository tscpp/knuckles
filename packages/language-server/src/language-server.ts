import getCompletion from "./features/completion.js";
import getDefinition from "./features/definition.js";
import getHover from "./features/hover.js";
import { LanguageService } from "./language-service.js";
import * as vscode from "vscode-languageserver/node.js";

export interface LanguageServerOptions {
  connection?: vscode.Connection;
}

export function startLanguageServer(options?: LanguageServerOptions) {
  const service = new LanguageService();

  // Create connection
  const connection =
    options?.connection ?? vscode.createConnection(vscode.ProposedFeatures.all);
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

  // Register features
  connection.onHover((params) => getHover(service, params));
  connection.onCompletion((params) => getCompletion(service, params));
  connection.onDefinition((params) => getDefinition(service, params));

  // Listen
  service.listen(connection);
  connection.listen();
  connection.console.log("Listening...");
}
