import * as esbuild from "esbuild-wasm/esm/browser";

export interface EnvironmentOptions {
  monacoInitialize?: boolean | undefined;
  monacoWorkerFactory?:
    | ((workerId: string, label: string) => Promise<Worker>)
    | undefined;
  monacoWorkerUrlFactory?:
    | ((workerId: string, label: string) => string)
    | undefined;
  esbuildInitialize?: boolean | undefined;
  esbuildWasmUrl?: string | URL | undefined;
  esbuildWasmModule?: WebAssembly.Module | undefined;
}

export async function configureEnvironment(options?: EnvironmentOptions) {
  if (options?.monacoInitialize !== false) {
    window.MonacoEnvironment ??= {};
    if (options?.monacoWorkerFactory) {
      window.MonacoEnvironment.getWorker = options.monacoWorkerFactory;
    } else if (options?.monacoWorkerUrlFactory) {
      window.MonacoEnvironment.getWorkerUrl = options.monacoWorkerUrlFactory;
    } else {
      window.MonacoEnvironment.getWorker = async (workerId, label) => {
        const workerUrl = window.MonacoEnvironment!.getWorkerUrl!(
          workerId,
          label,
        );
        const worker = new Worker(workerUrl, { type: "module" });
        return worker;
      };
      window.MonacoEnvironment.getWorkerUrl = (_workerId, label) => {
        switch (label) {
          case "css":
          case "scss":
          case "less":
            return "/build/monaco/css.worker.js";
          case "html":
          case "handlebars":
          case "razor":
            return "/build/monaco/html.worker.js";
          case "json":
            return "/build/monaco/json.worker.js";
          case "typescript":
          case "javascript":
            return "/build/monaco/ts.worker.js";
          default:
            return "/build/monaco/editor.worker.js";
        }
      };
    }
  }

  if (options?.esbuildInitialize !== false) {
    if (options?.esbuildWasmModule) {
      await esbuild.initialize({
        wasmModule: options.esbuildWasmModule,
      });
    } else if (options?.esbuildWasmUrl) {
      await esbuild.initialize({
        wasmURL: options.esbuildWasmUrl,
      });
    } else {
      const factory = "/build/esbuild/esbuild-wasm.js";
      const path = (await import(factory)).default;
      await esbuild.initialize({
        wasmURL: new URL(path, new URL(factory, location.href)),
      });
    }
  }
}
