import type { LanguageService } from "../language-service.js";
import { AnalyzerSeverity, type AnalyzerIssue } from "@knuckles/analyzer";
import { Position } from "@knuckles/location";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as vscode from "vscode-languageserver/node.js";

export interface DiagnosticParams {
  textDocument: vscode.TextDocumentIdentifier;
}

export default async function sendDiagnostics(
  service: LanguageService,
  params: DiagnosticParams,
): Promise<void> {
  const state = await service.getState(params.textDocument);

  const path = fileURLToPath(state.document.uri);
  writeFileSync(path + ".ts", state.snapshot?.generated ?? "// broken");

  const diagnostics = state.issues.map((issue) =>
    translateIssueToDiagnostic(issue, state.document.getText()),
  );

  await service.connection.sendDiagnostics({
    uri: state.document.uri,
    diagnostics,
  });
}

function translateIssueToDiagnostic(
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
