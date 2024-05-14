import styles from "./workspace.module.css";
import * as ko from "knockout";
import * as monaco from "monaco-editor";
import "~/bindings/ref";
import "~/bindings/resize";
import { Component } from "~/lib/component";
import html from "~/lib/html";
import type { Range } from "~/lib/location";

export type Marker = {
  range: Range;
  severity: monaco.MarkerSeverity;
  message: string;
  code: string;
};

export type WorkspaceFile = {
  name: ko.Observable<string>;
  text: ko.Observable<string>;
  diff: ko.Observable<string | null>;
  lang: ko.Observable<string>;
  markers: ko.Observable<Readonly<Record<string, readonly Marker[]>>>;
};

export function createWorkspaceFile(name: string, text = ""): WorkspaceFile {
  return {
    name: ko.observable(name),
    text: ko.observable(text),
    diff: ko.observable(null),
    lang: ko.observable(langFromExt(getFileExt(name))),
    markers: ko.observable({}),
  };
}

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
    case ".json":
      return "json";
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

export function setWorkspaceMarkers(
  file: WorkspaceFile,
  service: string,
  markers: readonly Marker[],
) {
  file.markers({
    ...file.markers(),
    [service]: markers,
  });
}

export type WorkspaceProps = {
  files: WorkspaceFile[];
  showDiff?: boolean;
  active: ko.Observable<WorkspaceFile | undefined>;
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
            data-bind="
              click: () => $component.props().active($data),
              css: { '${styles.active}': $component.props().active() === $data }
            "
          >
            <span data-bind="text: name"></span>
          </button>
          <!-- /ko -->
        </div>
      </div>
      <div
        class="${styles.editors}"
        data-bind="css: { '${styles.split}': isSplit() }"
      >
        <div
          data-bind="ref: containers.original"
          class="${styles.editor}"
        ></div>
        <div
          data-bind="ref: containers.generated, visible: isSplit()"
          class="${styles.editor}"
        ></div>
      </div>
    </div>
  `;

  readonly containers = {
    original: ko.observable<HTMLElement>(),
    generated: ko.observable<HTMLElement>(),
  };

  readonly editors = {
    original: ko.observable<monaco.editor.IStandaloneCodeEditor>(),
    generated: ko.observable<monaco.editor.IStandaloneCodeEditor>(),
  };

  readonly isSplit = ko.pureComputed(() => this.props().active()?.diff());

  override initialize(): void {
    const options: monaco.editor.IStandaloneEditorConstructionOptions = {
      automaticLayout: true,
      scrollBeyondLastLine: false,
      minimap: {
        enabled: false,
      },
      smoothScrolling: true,
      hover: {
        above: false,
      },
    };

    this.editors.original(
      monaco.editor.create(this.containers.original()!, {
        ...options,
      }),
    );
    this.editors.generated(
      monaco.editor.create(this.containers.generated()!, {
        ...options,
        readOnly: true,
      }),
    );

    // Update files on changes.
    this.editors.original()!.onDidChangeModelContent(() => {
      const activeFile = this.props().active();
      if (activeFile) {
        const text = this.editors.original()!.getValue() ?? "";
        activeFile.text(text);
      }
    });

    ko.computed(() => {
      const activeFile = this.props().active();
      if (!activeFile) return;

      // Sync original model.
      const originalEditor = this.editors.original();
      const originalModel = originalEditor?.getModel();
      const originalInSync =
        originalModel &&
        originalModel.getLanguageId() === activeFile.lang() &&
        originalModel.getValue() === activeFile.text();
      if (!originalInSync) {
        originalEditor!.setModel(
          activeFile
            ? monaco.editor.createModel(activeFile.text(), activeFile.lang())
            : monaco.editor.createModel("", "plain"),
        );
      }

      // Sync generated model.
      const modifiedEditor = this.editors.generated();
      if (modifiedEditor) {
        const modifiedModel = modifiedEditor.getModel();
        const modifiedInSync =
          modifiedModel &&
          modifiedModel.getLanguageId() === activeFile.lang() &&
          modifiedModel.getValue() === activeFile.diff();
        if (!modifiedInSync) {
          modifiedEditor.setModel(
            activeFile
              ? monaco.editor.createModel(
                  activeFile.diff() ?? activeFile.text(),
                  activeFile.lang(),
                )
              : monaco.editor.createModel("", "plain"),
          );
        }
      }
    });

    ko.computed(() => {
      const activeFile = this.props().active();
      if (!activeFile) return;
      const markers = activeFile.markers();

      const editor = this.editors.original();
      const model = editor?.getModel();
      if (model) {
        monaco.editor.setModelMarkers(
          model,
          "knuckles",
          Object.values(markers)
            .flat()
            .map(
              (marker): monaco.editor.IMarkerData => ({
                code: marker.code,
                message: marker.message,
                severity: marker.severity,
                startLineNumber: marker.range.start.line + 1,
                startColumn: marker.range.start.column + 1,
                endLineNumber: marker.range.end.line + 1,
                endColumn: marker.range.end.column + 1,
              }),
            ),
        );
      }
    });
  }
}
