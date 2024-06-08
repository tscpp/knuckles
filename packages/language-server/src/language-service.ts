import { DocumentStateProvider, ProgramProvider } from "./program.js";
import { AnalyzerSeverity, type AnalyzerIssue } from "@knuckles/analyzer";
import { Position } from "@knuckles/location";
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

  async getState(documentIdentifier: vscode.TextDocumentIdentifier) {
    const document = this.documents.get(documentIdentifier.uri);
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
      const state = await provider.touch();

      // Send diagnostics
      const text = document.getText();
      await connection.sendDiagnostics({
        uri: document.uri,
        diagnostics: state.issues.map((issue) =>
          analyzerIssueToVscodeDiagnostic(issue, text),
        ),
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
