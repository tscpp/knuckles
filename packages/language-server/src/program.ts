import type { LanguageService } from "./language-service.js";
import { Analyzer, type AnalyzerIssue } from "@knuckles/analyzer";
import {
  readConfigFile,
  discoverConfigFile,
  type NormalizedConfig,
  defaultConfig,
} from "@knuckles/config";
import type { Snapshot } from "@knuckles/fabricator";
import analyzerTypeScriptPlugin from "@knuckles/typescript/analyzer";
import assert from "node:assert";
import { normalize } from "node:path";
import { fileURLToPath } from "node:url";
import * as morph from "ts-morph";
import { ts } from "ts-morph";
import type { TextDocument } from "vscode-languageserver-textdocument";
import * as vscode from "vscode-languageserver/node.js";

const POLLING_DELAY = 250;

export type DocumentState = (
  | {
      broken: true;
      snapshot?: undefined;
      sourceFile?: undefined;
      service?: undefined;
      document?: undefined;
      checker?: undefined;
    }
  | {
      broken: false;
      snapshot: Snapshot;
      sourceFile: morph.SourceFile;
      service: morph.LanguageService;
      document: TextDocument;
      checker: morph.TypeChecker;
    }
) & {
  issues: AnalyzerIssue[];
};

export class DocumentStateProvider {
  #programProvider: ProgramProvider;
  #state: Promise<DocumentState>;

  constructor(
    readonly document: TextDocument,
    programProvider: ProgramProvider,
  ) {
    this.#programProvider = programProvider;
    this.#state = this.#refresh();
  }

  async #refresh(): Promise<DocumentState> {
    const startTime = performance.now();

    const path = fileURLToPath(this.document.uri);

    const program = await this.#programProvider.getProject(path);
    const analyzer = await program.getAnalyzer();
    const result = await analyzer.analyze(path, this.document.getText());

    const snapshot = result.snapshots.typescript;

    if (result.document && snapshot) {
      const sourceFile = result.metadata["tsSourceFile"];
      assert(sourceFile instanceof morph.SourceFile);

      const project = sourceFile.getProject();
      const service = project.getLanguageService();
      const checker = project.getTypeChecker();

      const endTime = performance.now();
      const deltaTime = endTime - startTime;
      console.log(`Analyze took ${deltaTime.toFixed(2)}ms`);

      return {
        broken: false,
        document: this.document,
        snapshot,
        sourceFile,
        service,
        checker,
        issues: result.issues,
      };
    } else {
      return {
        broken: true,
        issues: result.issues,
      };
    }
  }

  #debounce = false;

  touch() {
    if (!this.#debounce) {
      this.#state = new Promise((resolve, reject) => {
        setTimeout(() => {
          this.#refresh().then(resolve).catch(reject);
        }, POLLING_DELAY);
      });
    }

    return this.#state;
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

  #invalidate(path: string) {
    this.#cache.delete(path);
  }

  listen(service: LanguageService) {
    // Invalidate config cache when config file content is changed.
    return service.connection.onDidChangeWatchedFiles((event) => {
      const documents = new Set(event.changes.map((change) => change.uri));

      for (const uri of documents) {
        const path = fileURLToPath(uri);
        this.#invalidate(path);
      }
    });
  }
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
    return this.configPath
      ? await this.#configProvider.readConfig(this.configPath)
      : defaultConfig;
  }

  async getAnalyzer() {
    const config = await this.getConfig();

    if (this.#prevConfig !== config) {
      const hasTypeScriptPlugin = config.analyzer.plugins.some(
        (plugin) => plugin.name === "typescript",
      );
      const plugins = hasTypeScriptPlugin
        ? config.analyzer.plugins
        : [
            await analyzerTypeScriptPlugin({
              // TODO: resolve tsconfig
              tsconfig: undefined,
              mode: config.analyzer.mode,
            }),
            ...config.analyzer.plugins,
          ];
      this.#analyzer = new Analyzer({
        attributes: config.attributes,
        plugins,
      });
      this.#prevConfig = config;
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

  listen(service: LanguageService) {
    const disposables = [
      this.#configProvider.listen(service),

      // Dispose dangling programs
      service.documents.onDidClose((event) => {
        const path = fileURLToPath(event.document.uri);

        for (const instance of this.#instances) {
          instance.openDocuments.delete(path);

          if (instance.openDocuments.size === 0) {
            instance.dispose();
            this.#instances.delete(instance);
          }
        }
      }),
    ];

    return vscode.Disposable.create(() => {
      for (const disposable of disposables) {
        disposable.dispose();
      }
    });
  }
}
