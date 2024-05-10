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
import samples from "~/assets/samples.json";
import { Component } from "~/lib/component";
import debounce from "~/lib/debounce";
import html from "~/lib/html";

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

  readonly sample = ko.observable(samples[0]);
  readonly snapshot = ko.observable<Snapshot>();

  readonly enableVisualizer = ko.observable(false);

  readonly files = ko.pureComputed(
    () =>
      this.sample()?.files.map(
        (file): WorkspaceFile =>
          createWorkspaceFile(file.name, file.text, file.lang),
      ) ?? [],
  );
  readonly activeFile = ko.observable(this.files()[0]);

  analyzer: Promise<Analyzer> | undefined;
  readonly isAnalyzing = ko.observable(false);

  async createAnalyzer() {
    return new Analyzer({
      plugins: [
        await AnalyzerTypeScriptPlugin({
          browser: true,
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
  }, 500);

  onUpdate() {
    this.analyzeDebounce();
  }

  async analyze() {
    const activeFile = this.activeFile();
    if (activeFile?.lang() !== "html") return;
    if (this.isAnalyzing()) return;
    this.isAnalyzing(true);
    const start = performance.now();
    await this._analyze();
    const end = performance.now();
    console.log(`Analysis took ${end - start}ms`);
    this.isAnalyzing(false);
  }

  async _analyze() {
    const activeFile = this.activeFile()!;

    const analyzer = await this.analyzer!;
    const result = await analyzer.analyze(activeFile.name(), activeFile.text());

    this.snapshot(result.snapshots.typescript);
    activeFile.markers(
      result.issues.map((issue): Marker => {
        const start = issue.start ?? Position.fromOffset(0, activeFile.text());
        const end =
          issue.end ?? Position.fromOffset(start.offset + 1, activeFile.text());

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
