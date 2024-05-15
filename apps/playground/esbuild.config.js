import merge from "./assets/merge-esbuild.js";
import SAMPLES from "./assets/samples.js";
import STATIC_FILES from "./assets/static-files.js";
import sass from "esbuild-plugin-sass";
import nodeLib from "node-stdlib-browser";
import polyfillNode from "node-stdlib-browser/helpers/esbuild/plugin";

/** @type {import('esbuild').BuildOptions} */
const common = {
  entryPoints: {
    "monaco/css.worker":
      "node_modules/monaco-editor/esm/vs/language/css/css.worker.js",
    "monaco/html.worker":
      "node_modules/monaco-editor/esm/vs/language/html/html.worker.js",
    "monaco/json.worker":
      "node_modules/monaco-editor/esm/vs/language/json/json.worker.js",
    "monaco/ts.worker":
      "node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js",
    "monaco/editor.worker":
      "node_modules/monaco-editor/esm/vs/editor/editor.worker.js",
    "esbuild/esbuild-wasm": "node_modules/esbuild-wasm/esbuild.wasm",
  },
  bundle: true,
  minify: true,
  splitting: true,
  plugins: [polyfillNode(nodeLib), sass()],
  loader: {
    ".ttf": "file",
    ".wasm": "file",
  },
  define: {
    SAMPLES: JSON.stringify(SAMPLES),
    STATIC_FILES: JSON.stringify(STATIC_FILES),
  },
  inject: ["assets/polyfill.js"],
  external: ["import-meta-resolve"],
};

/** @type {import('esbuild').BuildOptions[]} */
export default [
  merge(common, {
    entryPoints: ["src/lib/playground.ts"],
    outdir: "dist",
    format: "esm",
  }),
  merge(common, {
    entryPoints: ["src/main.ts"],
    outdir: "public/build",
    format: "esm",
    sourcemap: true,
  }),
];
