window.MonacoEnvironment ??= {};
window.MonacoEnvironment.getWorker ??= async (_workerId, label) => {
  const module = getWorkerModule(label);
  const worker = new Worker(module, { type: "module" });
  return worker;
};

function getWorkerModule(label: string) {
  switch (label) {
    case "css":
    case "scss":
    case "less":
      return "/build/monaco/workers/css.js";
    case "html":
    case "handlebars":
    case "razor":
      return "/build/monaco/workers/html.js";
    case "json":
      return "/build/monaco/workers/json.js";
    case "typescript":
    case "javascript":
      return "/build/monaco/workers/typescript.js";
    default:
      return "/build/monaco/workers/editor.js";
  }
}
