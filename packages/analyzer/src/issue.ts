import type { Position } from "@knuckles/location";

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
}
