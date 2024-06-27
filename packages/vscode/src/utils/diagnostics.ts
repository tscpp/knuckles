import type { DiagnosticIdentifier } from "@knuckles/language-service";
import type * as vscode from "vscode";

export function isMatchingReference(
  diagnostic: vscode.Diagnostic,
  diagnosticId: DiagnosticIdentifier,
) {
  return (
    diagnostic.code === diagnosticId.code &&
    diagnostic.range.start.line === diagnosticId.range.start.line &&
    diagnostic.range.start.character === diagnosticId.range.start.column &&
    diagnostic.range.end.line === diagnosticId.range.end.line &&
    diagnostic.range.end.character === diagnosticId.range.end.column
  );
}
