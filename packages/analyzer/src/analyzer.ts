import { AnalyzerSeverity, type AnalyzerIssue } from "./issue.js";
import type {
  AnalyzerPlugin,
  AnalyzeContext,
  AnalyzerSnapshots,
  AnalyzerFlags,
} from "./plugin.js";
import standard from "./standard/plugin.js";
import {
  defaultConfig,
  normalizeConfig,
  type Config,
  type NormalizedConfig,
} from "@knuckles/config";
import { type ParserError, parse } from "@knuckles/parser";
import type { Document } from "@knuckles/syntax-tree";
import assert from "node:assert";

export interface AnalyzerOptions {
  config?: Config;
  flags?: AnalyzerFlags;
}

export interface AnalyzeOptions {
  cache?: AnalyzeCache;
}

export interface AnalyzeCache {
  document?: Document;
  snapshots?: Partial<AnalyzerSnapshots>;
}

export interface AnalyzeResult {
  issues: AnalyzerIssue[];
  snapshots: Partial<AnalyzerSnapshots>;
  metadata: Record<string, unknown>;
  document: Document | null;
}

export class Analyzer {
  #plugins = new Set<AnalyzerPlugin>();
  #configRaw: Config;
  #config!: NormalizedConfig;
  #flags: AnalyzerFlags;
  #initialized = false;

  constructor(options?: AnalyzerOptions) {
    this.#configRaw = options?.config ?? defaultConfig;
    this.#flags = options?.flags ?? {};
  }

  async initialize() {
    this.#config = this.#configRaw
      ? await normalizeConfig(this.#configRaw)
      : defaultConfig;

    const unsortedPlugins = [...this.#config.analyzer.plugins, standard()];
    for (const plugin of unsortedPlugins) {
      if (plugin.dependencies) {
        for (const [name, value] of Object.entries(plugin.dependencies)) {
          if (!value) continue;
          const { optional } = value;

          const dependency = unsortedPlugins.find(
            (plugin) => plugin.name === name,
          );

          if (optional === false && !dependency) {
            throw new Error(
              `Plugin "${plugin.name}" is dependant on "${name}".`,
            );
          }

          if (dependency) {
            this.#plugins.add(dependency);
          }
        }
      }
      this.#plugins.add(plugin);
    }

    for (const plugin of this.#plugins) {
      await plugin.initialize?.({
        config: this.#config,
        flags: this.#flags,
      });
    }

    this.#initialized = true;
  }

  async analyze(
    fileName: string,
    text: string,
    options?: AnalyzeOptions,
  ): Promise<AnalyzeResult> {
    if (!this.#initialized) {
      throw new Error(`Analyzer is not initialized.`);
    }

    const issues: AnalyzerIssue[] = [];
    const snapshots = (options?.cache?.snapshots ?? {}) as AnalyzerSnapshots;
    const metadata = {};

    let document: Document;
    if (options?.cache?.document) {
      document = options.cache.document;
    } else {
      const result = parse(text, {
        bindingAttributes: this.#config.attributes,
      });
      if (result.errors.length > 0) {
        return {
          issues: result.errors.map(parserErrorToAnalyzerIssue),
          snapshots: {},
          metadata,
          document: result.document,
        };
      } else {
        assert(result.document);
      }
      document = result.document;
    }

    const context: AnalyzeContext = {
      fileName,
      text,
      document,
      snapshots,
      metadata,
      report(issue) {
        issues.push(issue);
      },
    };

    for (const plugin of this.#plugins) {
      await plugin.analyze(context);
    }

    return {
      issues,
      snapshots: context.snapshots,
      metadata,
      document: document,
    };
  }

  async dispose() {
    for (const plugin of this.#plugins) {
      await plugin.dispose?.();
    }
  }
}

export function parserErrorToAnalyzerIssue(error: ParserError): AnalyzerIssue {
  return {
    start: error.start,
    end: error.end,
    message: error.description,
    name: "knuckles/parser",
    severity: AnalyzerSeverity.Error,
  };
}
