import type { Position, Range } from "@knuckles/location";

export enum AnalyzerSeverity {
  Error = "error",
  Warning = "warning",
}

export interface AnalyzerIssue {
  severity: AnalyzerSeverity;
  name: string;
  message: string;
  start: Position | undefined;
  end: Position | undefined;
  quickFix?: AnalyzerQuickFix | undefined;
}

export interface AnalyzerQuickFix {
  label?: string | undefined;
  edits: AnalyzerQuickFixEdit[];
}

export interface AnalyzerQuickFixEdit {
  range: Range;
  text: string;
}
