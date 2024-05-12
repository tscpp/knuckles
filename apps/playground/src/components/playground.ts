import styles from "./playground.module.css";
import Visualizer from "./visualizer/visualizer";
import Workspace, {
  createWorkspaceFile,
  type Marker,
  type WorkspaceFile,
} from "./workspace";
import { Analyzer, AnalyzerSeverity, type Snapshot } from "@knuckles/analyzer";
import { Position, Range } from "@knuckles/location";
import AnalyzerTypeScriptPlugin from "@knuckles/typescript/analyzer";
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

function langFromExt(ext: string) {
  switch (ext) {
    case ".ts":
    case ".mts":
    case ".cts":
    case ".tsx":
      return "typescript";
    case ".js":
    case ".mjs":
    case ".cjs":
    case ".jsx":
      return "javascript";
    case ".html":
      return "html";
    case ".css":
      return "css";
    default:
      return "plain";
  }
}

function getFileName(path: string) {
  path = path.replaceAll("\\", "/");
  const i = path.lastIndexOf("/");
  if (i === -1) return path;
  return path.slice(i);
}

function getFileExt(path: string) {
  const n = getFileName(path);
  const i = n.lastIndexOf(".");
  if (i === -1) return "";
  return n.slice(i);
}

export default class Playground extends Component {
  override readonly components = {
    Workspace,
    Visualizer,
  };

  readonly template = html`
    <div class="${styles.application}">
      <div class="${styles.toolbar}">
        <label>
          <input type="checkbox" data-bind="checked: enableVisualizer" />
          Mapping visualizer
        </label>
      </div>
      <div
        class="${styles.workspace}"
        data-bind="instantiate: [Workspace, {
          files: files(),
          active: activeFile
        }]"
      ></div>
      <!-- ko if: enableVisualizer() && snapshot() -->
      <div
        class="${styles.visualizer}"
        data-bind="instantiate: [Visualizer, { snapshot: snapshot() }]"
      ></div>
      <!-- /ko -->
    </div>
  `;

  readonly sample = ko.observable(SAMPLES[0]);
  readonly snapshot = ko.observable<Snapshot>();

  readonly enableVisualizer = ko.observable(false);

  readonly files = ko.pureComputed(
    () =>
      this.sample()?.files.map(
        (file): WorkspaceFile =>
          createWorkspaceFile(
            file.name,
            file.text,
            langFromExt(getFileExt(file.name)),
          ),
      ) ?? [],
  );
  readonly activeFile = ko.observable(this.files()[0]);

  analyzer: Promise<Analyzer> | undefined;
  #fileSystem: FileSystemHost | undefined;
  readonly isAnalyzing = ko.observable(false);

  async createAnalyzer() {
    this.#fileSystem = new InMemoryFileSystemHost();

    const dependencies = {
      "node_modules/knockout/package.json":
        "https://cdn.jsdelivr.net/npm/knockout@3.5.1/package.json",
      "node_modules/knockout/build/types/knockout.d.ts":
        "https://cdn.jsdelivr.net/npm/knockout@3.5.1/build/types/knockout.d.ts",
      "node_modules/@knuckles/typescript/package.json":
        "https://cdn.jsdelivr.net/npm/@knuckles/typescript/package.json",
      "node_modules/@knuckles/typescript/types/loose.d.ts":
        "https://cdn.jsdelivr.net/npm/@knuckles/typescript/types/loose.d.ts",
      "node_modules/@knuckles/typescript/types/lib/loose.d.ts":
        "https://cdn.jsdelivr.net/npm/@knuckles/typescript/types/lib/loose.d.ts",
      "node_modules/@knuckles/typescript/types/lib/common.d.ts":
        "https://cdn.jsdelivr.net/npm/@knuckles/typescript/types/lib/common.d.ts",
    };

    const dependenciesVirtualFiles = await Promise.all(
      Object.entries(dependencies).map(async ([name, url]) => {
        const response = await fetch(url);
        const text = await response.text();
        return [name, text] as const;
      }),
    );

    for (const [name, text] of dependenciesVirtualFiles) {
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
    this.analyzer = this.createAnalyzer();

    ko.computed(() => {
      const activeFile = this.activeFile();

      // Touch related props
      activeFile?.lang();
      activeFile?.text();

      this.onUpdate();
    });
  }

  analyzeDebounce = debounce(async () => {
    this.analyze();
  }, 200);

  onUpdate() {
    this.analyzeDebounce();
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
    file.markers(
      result.issues.map((issue): Marker => {
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
      }),
    );
  }
}
