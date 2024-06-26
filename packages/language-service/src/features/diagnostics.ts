import type { LanguageServiceWorker } from "../private.js";
import type { Document } from "../utils/document.js";
import { getFullIssueRange } from "../utils/issue.js";
import type { ProtocolRange } from "../utils/position.js";
import { AnalyzerSeverity, type AnalyzerIssue } from "@knuckles/analyzer";

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
    translateIssueToDiagnostic(state.document, issue),
  );

  return diagnostics;
}

function translateIssueToDiagnostic(
  document: Document,
  issue: AnalyzerIssue,
): Diagnostic {
  const range = getFullIssueRange(document, issue);
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
