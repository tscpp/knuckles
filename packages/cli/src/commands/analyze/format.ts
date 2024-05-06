import { type AnalyzerIssue } from "@knuckles/analyzer";
import { Chalk, supportsColor } from "chalk";
import { relative } from "node:path";

export type FormatDiagnosticOptions = {
  color?: boolean | "auto";
  fileName?: string;
};

export function formatIssue(
  issue: AnalyzerIssue,
  options?: FormatDiagnosticOptions,
) {
  const chalk = new Chalk({
    level:
      !options?.color || options.color === "auto"
        ? supportsColor
          ? supportsColor.level
          : 0
        : options?.color
          ? 1
          : 0,
  });

  const location = issue.start
    ? `${issue.start.line}:${issue.start.column}`
    : "";
  const path = options?.fileName
    ? relative(process.cwd(), options?.fileName)
    : undefined;
  const link = path ? `${path}:${location}` : location;
  return `${link} ${chalk.red(issue.severity)} ${chalk.grey(issue.name)} ${issue.message}`;
}
