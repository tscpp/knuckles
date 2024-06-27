import type { LanguageServiceWorker } from "../private.js";
import type { Document } from "./document.js";
import {
  Analyzer,
  type AnalyzerFlags,
  type AnalyzerIssue,
} from "@knuckles/analyzer";
import {
  readConfigFile,
  discoverConfigFile,
  type NormalizedConfig,
  defaultConfig,
} from "@knuckles/config";
import type { Snapshot } from "@knuckles/fabricator";
import type { SyntaxTree } from "@knuckles/syntax-tree";
import analyzerTypeScriptPlugin from "@knuckles/typescript/analyzer";
import assert from "node:assert";
import { normalize } from "node:path";
import * as morph from "ts-morph";
import { ts } from "ts-morph";

export type DocumentState = (
  | {
      broken: true;
      snapshot?: undefined;
      tsSourceFile?: undefined;
      tsProject?: undefined;
      syntaxTree?: undefined;
    }
  | {
      broken: false;
      snapshot: Snapshot;
      tsSourceFile: morph.SourceFile;
      tsProject: morph.Project;
      syntaxTree: SyntaxTree;
    }
) & {
  document: Document;
  issues: AnalyzerIssue[];
};

export class DocumentStateProvider {
  #programProvider: ProgramProvider;
  #state: Promise<DocumentState>;

  constructor(
    protected service: LanguageServiceWorker,
    readonly document: Document,
    programProvider: ProgramProvider,
  ) {
    this.#programProvider = programProvider;
    this.#state = Promise.resolve({
      broken: true,
      document: document,
      issues: [],
    });
  }

  async #refresh(): Promise<DocumentState> {
    const startTime = performance.now();
    this.service.logger.info("Analyzing...");

    const program = await this.#programProvider.getProject(this.document.path);
    const analyzer = await program.getAnalyzer();
    const result = await analyzer.analyze(
      this.document.path,
      this.document.text,
    );

    const endTime = performance.now();
    const deltaTime = endTime - startTime;
    this.service.logger.info(`Analyze took ${deltaTime.toFixed(0)}ms`);

    const snapshot = result.snapshots.typescript;

    if (result.document && snapshot) {
      const tsSourceFile = result.metadata["tsSourceFile"];
      assert(tsSourceFile instanceof morph.SourceFile);

      const tsProject = tsSourceFile.getProject();

      return {
        broken: false,
        document: this.document,
        snapshot,
        tsSourceFile: tsSourceFile,
        tsProject,
        issues: result.issues,
        syntaxTree: result.document,
      };
    } else {
      return {
        broken: true,
        issues: result.issues,
        document: this.document,
      };
    }
  }

  touch() {
    return (this.#state = this.#refresh());
  }

  get() {
    return this.#state;
  }
}

export class ConfigProvider {
  #cache = new Map<string, NormalizedConfig>();
  #version = new Map<string, number>();

  async findConfig(path: string) {
    return await discoverConfigFile(path);
  }

  async readConfig(path: string) {
    path = normalize(path);
    if (this.#cache.has(path)) {
      return this.#cache.get(path)!;
    } else {
      const version = this.#version.get(path) ?? 0;
      const config = await readConfigFile(path, version.toString());
      this.#version.set(path, version + 1);
      this.#cache.set(path, config);
      return config;
    }
  }

  // #invalidate(path: string) {
  //   this.#cache.delete(path);
  // }

  // listen(service: LanguageService) {
  //   // Invalidate config cache when config file content is changed.
  //   return service.connection.onDidChangeWatchedFiles((event) => {
  //     const documents = new Set(event.changes.map((change) => change.uri));

  //     for (const uri of documents) {
  //       const path = fileURLToPath(uri);
  //       this.#invalidate(path);
  //     }
  //   });
  // }
}

export class Program {
  #configProvider: ConfigProvider;
  #prevConfig: NormalizedConfig | undefined;
  #analyzer: Analyzer | undefined;

  readonly openDocuments = new Set<string>();

  constructor(
    readonly configPath: string | null,
    readonly tsconfigPath: string | null,
    configProvider: ConfigProvider,
  ) {
    this.#configProvider = configProvider;
  }

  async getConfig() {
    const config = this.configPath
      ? await this.#configProvider.readConfig(this.configPath)
      : defaultConfig;

    const hasTypeScriptPlugin = config.analyzer.plugins.some(
      (plugin) => plugin.name === "typescript",
    );
    if (!hasTypeScriptPlugin) {
      config.analyzer.plugins.unshift(await analyzerTypeScriptPlugin());
    }

    return config;
  }

  getFlags(): AnalyzerFlags {
    return {
      tsconfig: this.tsconfigPath,
    };
  }

  async getAnalyzer() {
    const config = await this.getConfig();
    const flags = this.getFlags();

    if (this.#prevConfig !== config) {
      this.#prevConfig = config;

      this.#analyzer = new Analyzer({
        config,
        flags,
      });
      await this.#analyzer.initialize();
    }

    return this.#analyzer!;
  }

  dispose() {
    this.#analyzer?.dispose();
  }
}

export class ProgramProvider {
  #configProvider = new ConfigProvider();
  #instances = new Set<Program>();

  async getProject(path: string) {
    const configPath = await this.#configProvider.findConfig(path);
    const tsconfigPath = ts.findConfigFile(path, ts.sys.fileExists) ?? null;

    // Check if matching program exists.
    let instance = Array.from(this.#instances).find(
      (instance) =>
        instance.configPath === configPath &&
        instance.tsconfigPath === tsconfigPath,
    );

    if (!instance) {
      // Else, instansiate new.
      instance = new Program(configPath, tsconfigPath, this.#configProvider);
      this.#instances.add(instance);
    }

    instance?.openDocuments.add(path);
    return instance;
  }

  // listen(service: LanguageService) {
  //   const disposables = [
  //     this.#configProvider.listen(service),

  //     // Dispose dangling programs
  //     service.documents.onDidClose((event) => {
  //       const path = fileURLToPath(event.document.uri);

  //       for (const instance of this.#instances) {
  //         instance.openDocuments.delete(path);

  //         if (instance.openDocuments.size === 0) {
  //           instance.dispose();
  //           this.#instances.delete(instance);
  //         }
  //       }
  //     }),
  //   ];

  //   return vscode.Disposable.create(() => {
  //     for (const disposable of disposables) {
  //       disposable.dispose();
  //     }
  //   });
  // }
}
