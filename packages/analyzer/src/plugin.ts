import type { AnalyzerIssue } from "./issue.js";
import type { Snapshot } from "@knuckles/fabricator";
import type { Document } from "@knuckles/syntax-tree";

export interface AnalyzerSnapshots {
  [name: string]: Snapshot | undefined;
  typescript?: Snapshot;
  javascript: Snapshot;
}

export interface AnalyzeContext {
  readonly fileName: string;
  readonly text: string;
  readonly document: Document;

  readonly snapshots: AnalyzerSnapshots;

  report(issue: AnalyzerIssue): void;
}

export interface AnalyzerPluginDependency {
  optional?: boolean;
}

export interface AnalyzerPluginDependencies {
  [name: string]: AnalyzerPluginDependency | undefined;
  typescript?: AnalyzerPluginDependency;
  javascript?: AnalyzerPluginDependency;
}

export interface AnalyzerPlugin {
  readonly name: string;
  readonly dependencies?: AnalyzerPluginDependencies;
  analyze(context: AnalyzeContext): void | PromiseLike<void>;
  dispose?(): void | PromiseLike<void>;
}

export type AnalyzerPluginFactory = (
  options?: unknown,
) => AnalyzerPlugin | PromiseLike<AnalyzerPlugin>;
