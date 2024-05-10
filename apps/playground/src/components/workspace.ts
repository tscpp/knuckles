import styles from "./workspace.module.css";
import * as ko from "knockout";
import * as monaco from "monaco-editor";
import "~/bindings/ref";
import "~/bindings/resize";
import { Component } from "~/lib/component";
import html from "~/lib/html";
import type { Range } from "~/lib/location";
import "~/lib/monaco";

export type Marker = {
  range: Range;
  severity: monaco.MarkerSeverity;
  message: string;
  code: string;
};

export type WorkspaceFile = {
  name: ko.Observable<string>;
  text: ko.Observable<string>;
  lang: ko.Observable<string>;
  markers: ko.Observable<readonly Marker[]>;
};

export function createWorkspaceFile(
  name: string,
  text = "",
  lang = "plain",
): WorkspaceFile {
  return {
    name: ko.observable(name),
    text: ko.observable(text),
    lang: ko.observable(lang),
    markers: ko.observable<readonly Marker[]>([]),
  };
}

export type WorkspaceProps = {
  files: WorkspaceFile[];
  active: ko.Observable<WorkspaceFile>;
};

export default class Workspace extends Component<WorkspaceProps> {
  readonly template = html`
    <div class="${styles.workspace}">
      <div class="${styles.toolbar}">
        <div class="${styles.files}">
          <!-- ko foreach: props().files -->
          <button
            class="${styles.file}"
            type="button"
            data-bind="click: () => $component.props().active($data)"
          >
            <span data-bind="text: name"></span>
          </button>
          <!-- /ko -->
        </div>
      </div>
      <div data-bind="ref: container" class="${styles.editor}"></div>
    </div>
  `;

  readonly container = ko.observable<HTMLElement>();
  editor: monaco.editor.IStandaloneCodeEditor | undefined;

  override initialize(): void {
    const activeFile = this.props().active();

    this.editor = monaco.editor.create(this.container()!, {
      language: activeFile?.lang() ?? "plain",
      value: activeFile?.text(),
      automaticLayout: true,
      scrollBeyondLastLine: false,
      minimap: {
        enabled: false,
      },
      smoothScrolling: true,
    });

    this.editor.onDidChangeModelContent(() => {
      const activeFile = this.props().active();
      const text = this.editor?.getValue() ?? "";
      activeFile.text(text);
    });

    ko.computed(() => {
      const activeFile = this.props().active();

      const model = this.editor?.getModel();
      const inSync =
        model &&
        model.getLanguageId() === activeFile.lang() &&
        model.getValue() === activeFile.text();

      if (!inSync) {
        this.editor!.setModel(
          activeFile
            ? monaco.editor.createModel(activeFile.text(), activeFile.lang())
            : monaco.editor.createModel("", "plain"),
        );
      }
    });

    ko.computed(() => {
      const activeFile = this.props().active();
      const markers = activeFile.markers();

      const model = this.editor?.getModel();
      if (model) {
        monaco.editor.setModelMarkers(
          model,
          "knuckles",
          markers.map(
            (marker): monaco.editor.IMarkerData => ({
              code: marker.code,
              message: marker.message,
              severity: marker.severity,
              startLineNumber: marker.range.start.line + 1,
              startColumn: marker.range.start.column,
              endLineNumber: marker.range.end.line + 1,
              endColumn: marker.range.end.column,
            }),
          ),
        );
      }
    });
  }
}
