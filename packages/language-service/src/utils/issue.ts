import type { Document } from "./document.js";
import type { AnalyzerIssue } from "@knuckles/analyzer";
import { Position, Range } from "@knuckles/location";

export function getFullIssueRange(document: Document, issue: AnalyzerIssue) {
  const start = issue.start ?? Position.fromOffset(0, document.text);
  const end = issue.end ?? Position.fromOffset(start.offset + 1, document.text);
  const range = new Range(start, end);
  return range;
}
