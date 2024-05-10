import type { AnalyzerSeverity } from "../issue.js";
import type { AnalyzeContext } from "../plugin.js";

export interface Rule {
  name: string;
  severity: AnalyzerSeverity;
  check(context: AnalyzeContext): void | PromiseLike<void>;
}
