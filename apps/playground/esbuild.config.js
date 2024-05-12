import merge from "./assets/merge-esbuild.js";
import samples from "./assets/samples.js";
import sass from "esbuild-plugin-sass";
import nodeLib from "node-stdlib-browser";
import polyfillNode from "node-stdlib-browser/helpers/esbuild/plugin";

/** @type {import('esbuild').BuildOptions} */
const common = {
  entryPoints: {
    "monaco/workers/css":
      "node_modules/monaco-editor/esm/vs/language/css/css.worker.js",
    "monaco/workers/html":
      "node_modules/monaco-editor/esm/vs/language/html/html.worker.js",
    "monaco/workers/json":
      "node_modules/monaco-editor/esm/vs/language/json/json.worker.js",
    "monaco/workers/typescript":
      "node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js",
    "monaco/workers/editor":
      "node_modules/monaco-editor/esm/vs/editor/editor.worker.js",
  },
  bundle: true,
  minify: true,
  splitting: true,
  plugins: [polyfillNode(nodeLib), sass()],
  loader: {
    ".ttf": "file",
  },
  define: {
    SAMPLES: JSON.stringify(samples),
  },
  inject: ["assets/polyfill.js"],
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
