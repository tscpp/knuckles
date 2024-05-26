/**
 * @type {import('esbuild').BuildOptions}
 */
export default {
  entryPoints: ["src/extension.ts", "src/language-server.ts"],
  format: "cjs",
  bundle: true,
  minify: false,
  platform: "node",
  external: ["vscode"],
  outdir: "dist",
  sourcemap: true,
  outExtension: { ".js": ".cjs" },
};
