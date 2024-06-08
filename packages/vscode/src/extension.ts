import * as vscode from "vscode";
import {
  type ForkOptions,
  LanguageClient,
  type LanguageClientOptions,
  type ServerOptions,
  TransportKind,
} from "vscode-languageclient/node.js";

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
  console.log("activate");

  const serverModule = context.asAbsolutePath("./dist/language-server.cjs");
  console.log(serverModule);
  const debugOptions: ForkOptions = {
    execArgv: ["--nolazy", "--inspect=6009"],
  };

  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      {
        scheme: "file",
        language: "html",
      },
    ],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher(
        "**/knuckles.config.*",
      ),
    },
  };

  client = new LanguageClient(
    "knucklesLanguageServer",
    "Knuckles Language Server",
    serverOptions,
    clientOptions,
  );

  client.start();

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      client.sendNotification("workspace/didChangeActiveTextEditor", {
        uri: editor.document.uri.toString(),
      });
    }
  });
}

export function deactivate(): Thenable<void> | undefined {
  console.log("deactivate");

  if (!client) {
    return undefined;
  }
  return client.stop();
}
