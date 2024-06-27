/**
 * @type {import('esbuild').BuildOptions}
 */
export default {
  entryPoints: ["src/extension.ts", "src/worker.ts"],
  format: "cjs",
  bundle: true,
  minify: false,
  platform: "node",
  external: ["vscode"],
  outdir: "dist",
  sourcemap: true,
  outExtension: { ".js": ".cjs" },
};
