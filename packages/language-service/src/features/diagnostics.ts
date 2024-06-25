import type { LanguageServiceWorker } from "../private.js";
import type { ProtocolRange } from "../utils/position.js";
import { AnalyzerSeverity, type AnalyzerIssue } from "@knuckles/analyzer";
import { Position, Range } from "@knuckles/location";

export interface DiagnosticsParams {
  fileName: string;
}

export interface Diagnostic {
  range: ProtocolRange;
  severity: DiagnosticSeverity;
  message: string;
  source: string;
  code: string;
}

export enum DiagnosticSeverity {
  Error,
  Warning,
  Information,
  Hint,
}

export type Diagnostics = Diagnostic[];

export default async function getDiagnostics(
  this: LanguageServiceWorker,
  params: DiagnosticsParams,
): Promise<Diagnostics> {
  const state = await this.getDocumentState(params.fileName);

  const diagnostics = state.issues.map((issue) =>
    translateIssueToDiagnostic(issue, state.document.text),
  );

  return diagnostics;
}

function translateIssueToDiagnostic(
  issue: AnalyzerIssue,
  text: string,
): Diagnostic {
  const start = issue.start ?? Position.fromOffset(0, text);
  const end = issue.end ?? Position.fromOffset(start.offset + 1, text);
  const range = new Range(start, end);
  const severity = {
    [AnalyzerSeverity.Error]: DiagnosticSeverity.Error,
    [AnalyzerSeverity.Warning]: DiagnosticSeverity.Warning,
  }[issue.severity];
  return {
    range,
    severity,
    message: issue.message,
    source: "knuckles",
    code: issue.name,
  };
}
