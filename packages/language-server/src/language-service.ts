import sendDiagnostics from "./features/diagnostics.js";
import { DocumentStateProvider, ProgramProvider } from "./program.js";
import assert from "node:assert";
import { TextDocument } from "vscode-languageserver-textdocument";
import * as vscode from "vscode-languageserver/node.js";

export class LanguageService {
  readonly documents = new vscode.TextDocuments(TextDocument);
  #stateMap = new WeakMap<TextDocument, DocumentStateProvider>();

  #_connection!: vscode.Connection;
  get connection() {
    return this.#_connection;
  }

  #programProvider = new ProgramProvider();

  #disposeState(document: TextDocument) {
    this.#stateMap.delete(document);
  }

  async getState(identifier: vscode.TextDocumentIdentifier) {
    const document = this.documents.get(identifier.uri);
    assert(document);
    const provider = this.#stateMap.get(document);
    assert(provider);
    const state = await provider.get();
    return state;
  }

  listen(connection: vscode.Connection) {
    this.#_connection = connection;

    this.documents.onDidOpen(async (event) => {
      // Create document state
      const { document } = event;
      const provider = new DocumentStateProvider(
        document,
        this.#programProvider,
      );
      this.#stateMap.set(document, provider);
    });

    const touch = async (document: TextDocument) => {
      const provider = this.#stateMap.get(document)!;
      await provider.touch();

      await sendDiagnostics(this, {
        textDocument: vscode.TextDocumentIdentifier.create(document.uri),
      });
    };

    this.documents.onDidChangeContent(async (event) => {
      const { document } = event;
      touch(document);
    });

    connection.onNotification(
      "workspace/didChangeActiveTextEditor",
      (params) => {
        const uri = params.uri;
        const document = this.documents.get(uri);
        if (document) {
          touch(document);
        }
      },
    );

    this.documents.onDidClose((event) => {
      // Dispose document state
      this.#disposeState(event.document);
    });
    this.documents.listen(connection);
    this.#programProvider.listen(this);
  }
}
