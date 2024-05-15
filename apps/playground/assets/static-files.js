import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = resolve("../..");
const r = (path) => readFileSync(join(ROOT, path), "utf-8");

export default {
  "node_modules/@knuckles/typescript/package.json": JSON.stringify({
    name: "@knuckles/typescript",
    version: "0.0.0",
    type: "module",
    exports: {
      "./types": {
        types: "./types/index.d.ts",
      },
    },
  }),
  "node_modules/@knuckles/typescript/types/index.d.ts": r(
    "packages/typescript/types/index.d.ts",
  ),
};
