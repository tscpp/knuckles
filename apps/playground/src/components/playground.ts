import styles from "./playground.module.css";
import Visualizer from "./visualizer/visualizer";
import Workspace, {
  createWorkspaceFile,
  setWorkspaceMarkers,
  type Marker,
  type WorkspaceFile,
} from "./workspace";
import { Analyzer, AnalyzerSeverity } from "@knuckles/analyzer";
import type { Snapshot } from "@knuckles/fabricator";
import { Position, Range } from "@knuckles/location";
import * as ssr from "@knuckles/ssr";
import AnalyzerTypeScriptPlugin from "@knuckles/typescript/analyzer";
import * as esbuild from "esbuild-wasm/esm/browser";
import * as ko from "knockout";
import * as monaco from "monaco-editor";
import {
  type FileSystemHost,
  InMemoryFileSystemHost,
  ScriptTarget,
  ModuleKind,
  ModuleResolutionKind,
  ts,
} from "ts-morph";
import { Component } from "~/lib/component";
import debounce from "~/lib/debounce";
import html from "~/lib/html";

type Sample = {
  readonly name: string;
  readonly active: string;
  readonly files: Readonly<Record<string, string>>;
  readonly settings: {
    readonly analyzer: boolean;
    readonly ssr: boolean;
  };
};

declare const SAMPLES: readonly Sample[];
declare const STATIC_FILES: Readonly<Record<string, string>>;

export default class Playground extends Component {
  override readonly components = {
    Workspace,
    Visualizer,
  };

  readonly template = html`
    <div class="${styles.application}">
      <div class="${styles.toolbar}">
        <div>
          Sample:
          <select data-bind="options: samples, value: selectedSample"></select>
          <button type="button" data-bind="click: loadSample">Load</button>
        </div>
        <div>
          <label>
            <input type="checkbox" data-bind="checked: settings.analyzer" />
            Analyze
          </label>
          <label>
            <input type="checkbox" data-bind="checked: settings.ssr" />
            SSR
          </label>
          <div class="${styles.debug}">
            <label>
              <input type="checkbox" data-bind="checked: settings.debug" />
              Debug
            </label>
            <!-- ko if: settings.debug() -->
            <label>
              <input type="checkbox" data-bind="checked: settings.visualizer" />
              Visualizer
            </label>
            <!-- /ko -->
          </div>
        </div>
      </div>
      <div
        class="${styles.workspace}"
        data-bind="instantiate: [Workspace, {
          files: files(),
          active: activeFile,
          showDiff: showDiff()
        }]"
      ></div>
      <!-- ko if: settings.debug() && settings.visualizer() && snapshot() -->
      <div
        class="${styles.visualizer}"
        data-bind="instantiate: [Visualizer, { snapshot: snapshot() }]"
      ></div>
      <!-- /ko -->
    </div>
  `;

  readonly sample = ko.observable<Sample>();
  readonly samples = ko.pureComputed(() =>
    SAMPLES.map((sample) => sample.name),
  );

  readonly selectedSample = ko.observable("analyzer");
  loadSample() {
    const sample = SAMPLES.find(
      (sample) => sample.name === this.selectedSample(),
    )!;

    // Assign settings configured in sample.
    for (const [key, value] of Object.entries(sample.settings)) {
      (this.settings as Record<string, ko.Observable<unknown>>)[key]?.(value);
    }

    // Load files.
    this.files(
      Object.entries(sample.files).map(
        ([name, text]): WorkspaceFile => createWorkspaceFile(name, text),
      ),
    );

    // Set active file.
    this.activeFile(
      this.files().find((file) => file.name() === sample.active) ??
        this.files()[0],
    );
  }

  readonly snapshot = ko.observable<Snapshot>();

  readonly settings = {
    debug: ko.observable(false),
    analyzer: ko.observable(false),
    ssr: ko.observable(false),
    visualizer: ko.observable(false),
  };

  readonly showDiff = ko.pureComputed(
    () => this.settings.ssr() && this.activeFile()?.lang() === "html",
  );

  readonly files = ko.observableArray<WorkspaceFile>();
  readonly activeFile = ko.observable(this.files()[0]);

  analyzer: Promise<Analyzer> | undefined;
  #fileSystem: FileSystemHost | undefined;
  readonly isAnalyzing = ko.observable(false);

  async createAnalyzer() {
    this.#fileSystem = new InMemoryFileSystemHost();

    const download = {
      "node_modules/knockout/package.json":
        "https://cdn.jsdelivr.net/npm/knockout@3.5.1/package.json",
      "node_modules/knockout/build/types/knockout.d.ts":
        "https://cdn.jsdelivr.net/npm/knockout@3.5.1/build/types/knockout.d.ts",
    };

    const networkFiles = Object.fromEntries(
      await Promise.all(
        Object.entries(download).map(async ([name, url]) => {
          const response = await fetch(url);
          const text = await response.text();
          return [name, text] as const;
        }),
      ),
    );

    const files = {
      ...networkFiles,
      ...STATIC_FILES,
    };

    for (const [name, text] of Object.entries(files)) {
      this.#fileSystem.writeFileSync(name, text);
    }

    return new Analyzer({
      plugins: [
        await AnalyzerTypeScriptPlugin({
          fileSystem: this.#fileSystem,
          tsconfig: {
            target: ScriptTarget.ESNext,
            module: ModuleKind.ESNext,
            moduleResolution: ModuleResolutionKind.Bundler,
            moduleDetection: ts.ModuleDetectionKind.Force,
          },
        }),
      ],
    });
  }

  override initialize() {
    this.loadSample();

    this.analyzer = this.createAnalyzer();

    // Run analyzer when active file changes.
    ko.computed(() => {
      // Touch related props
      const activeFile = this.activeFile();
      activeFile?.lang();
      activeFile?.text();

      this.onUpdate();
    });

    // Clear markers when analyzer is disabled.
    ko.computed(() => {
      if (!this.settings.analyzer()) {
        for (const file of this.files()) {
          setWorkspaceMarkers(file, "analyzer", []);
        }
      }
    });

    // Clear markers when ssr is disabled.
    ko.computed(() => {
      if (!this.settings.ssr()) {
        for (const file of this.files()) {
          setWorkspaceMarkers(file, "ssr", []);
          file.diff(null);
        }
      }
    });
  }

  analyzeDebounce = debounce(async () => this.analyze(), 200);
  ssrDebounce = debounce(async () => this.ssr(), 200);

  onUpdate() {
    if (this.settings.analyzer()) {
      this.analyzeDebounce();
    }

    if (this.settings.ssr()) {
      this.ssrDebounce();
    }
  }

  readonly isRendering = ko.observable(false);

  async ssr() {
    const file = this.activeFile();
    if (!file || file.lang() !== "html") return;

    if (this.isRendering()) return;
    this.isRendering(true);
    const start = performance.now();
    await this._ssr();
    const end = performance.now();
    console.log(`SSR took ${end - start}ms`);
    this.isRendering(false);
  }

  async _ssr() {
    const activeFile = this.activeFile()!;
    const fallbackRange = new Range(
      Position.zero,
      Position.fromOffset(activeFile.text().length, activeFile.text()),
    );

    let result: ssr.RenderResult;
    try {
      const moduleProvider = ssr.createModuleProvider({
        resolve: async (ctx) => {
          try {
            if (ctx.specifier.startsWith("./")) {
              ctx.specifier = ctx.specifier.slice(2);
            }
            const file = this.files().find((file) => {
              return (
                file.name() === ctx.specifier ||
                (ctx.specifier.endsWith(".js") &&
                  file.name() === ctx.specifier.slice(0, -3) + ".ts")
              );
            });
            return { id: file?.name(), namespace: "virtual" };
          } catch (error) {
            console.error(error);
            throw error;
          }
        },
        load: async (ctx) => {
          try {
            const file = this.files().find((file) => file.name() === ctx.id)!;
            const result = await esbuild.transform(file.text(), {
              format: "esm",
            });
            const b64 = "data:text/javascript;base64," + btoa(result.code);
            const exports = await import(b64);
            return { exports };
          } catch (error) {
            console.error(error);
            throw error;
          }
        },
      });

      result = await ssr.render(activeFile.text(), {
        fileName: activeFile.name(),
        preserveHints: true,
        module: moduleProvider,
        fallback: true,
      });
    } catch (error) {
      console.error(error);
      return;
    }

    const toMarker = (diagnostic: ssr.Diagnostic): Marker => ({
      range: diagnostic.range ?? fallbackRange,
      code: "ssr/" + (diagnostic.code ?? "unknown"),
      message: diagnostic.message,
      severity: {
        error: monaco.MarkerSeverity.Error,
        warning: monaco.MarkerSeverity.Warning,
      }[diagnostic.type],
    });

    setWorkspaceMarkers(
      activeFile,
      "ssr",
      [...result.errors, ...result.warnings].map(toMarker),
    );

    activeFile.diff(result.modified);
  }

  async analyze() {
    if (this.isAnalyzing()) return;
    this.isAnalyzing(true);
    const start = performance.now();
    await this._analyze();
    const end = performance.now();
    console.log(`Analysis took ${end - start}ms`);
    this.isAnalyzing(false);
  }

  async _analyze() {
    // TODO: lint all html files.
    const file = this.files().find((file) => file.name() === "view.html");
    if (!file) return;

    // TODO: delete old files
    for (const file of this.files()) {
      this.#fileSystem!.writeFileSync(file.name(), file.text());
    }

    const analyzer = await this.analyzer!;
    const result = await analyzer.analyze(file.name(), file.text());

    this.snapshot(result.snapshots.typescript);

    const markers = result.issues.map((issue): Marker => {
      const start = issue.start ?? Position.fromOffset(0, file.text());
      const end =
        issue.end ?? Position.fromOffset(start.offset + 1, file.text());

      const severity = {
        [AnalyzerSeverity.Error]: monaco.MarkerSeverity.Error,
        [AnalyzerSeverity.Warning]: monaco.MarkerSeverity.Warning,
      }[issue.severity];

      return {
        code: issue.name,
        message: issue.message,
        range: new Range(start, end),
        severity,
      };
    });
    setWorkspaceMarkers(file, "analyzer", markers);
  }
}
