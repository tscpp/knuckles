window.MonacoEnvironment ??= {};
window.MonacoEnvironment.getWorker ??= async (_workerId, label) => {
  const module = await getWorkerModule(label);
  const constructor = module.default;
  const worker = new constructor();
  return worker;
};

function getWorkerModule(label: string) {
  switch (label) {
    case "css":
    case "scss":
    case "less":
      return import("monaco-editor/esm/vs/language/css/css.worker.js?worker");
    case "html":
    case "handlebars":
    case "razor":
      return import("monaco-editor/esm/vs/language/html/html.worker.js?worker");
    case "json":
      return import("monaco-editor/esm/vs/language/json/json.worker.js?worker");
    case "typescript":
    case "javascript":
      return import(
        "monaco-editor/esm/vs/language/typescript/ts.worker?worker"
      );
    default:
      return import("monaco-editor/esm/vs/editor/editor.worker.js?worker");
  }
}
