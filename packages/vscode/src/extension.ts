import * as vscode from "vscode";
import {
  type ForkOptions,
  LanguageClient,
  type LanguageClientOptions,
  type ServerOptions,
  TransportKind,
  RequestType,
} from "vscode-languageclient/node.js";

let client: LanguageClient;

export const GetDocumentTextRequest = new RequestType<
  { uri: string },
  string,
  void
>("custom/readFile");

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
    markdown: {
      isTrusted: true,
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
  );
}

export function deactivate(): Thenable<void> | undefined {
  console.log("deactivate");

  if (!client) {
    return undefined;
  }
  return client.stop();
}
