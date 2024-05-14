const esbuild = require("esbuild");
const path = require("path");
const child_process = require("child_process");
const fs = require("fs");

esbuild.buildSync({
  entryPoints: [path.resolve(__dirname, "../../src/webpack/loader.ts")],
  outdir: path.resolve(__dirname, "./build"),
  bundle: true,
  platform: "node",
  target: ["node20"],
  format: "cjs",
  outExtension: {
    ".js": ".cjs",
  },
  logLevel: "error",
});

const result = child_process.spawnSync(
  "node",
  [path.resolve(__dirname, "./run-test.cjs")],
  { stdio: "inherit" },
);

fs.rmSync(path.resolve(__dirname, "./build"), { recursive: true, force: true });

process.exit(result.status ?? 0);
