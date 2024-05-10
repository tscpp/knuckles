import { resolve } from "node:path";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), nodePolyfills()],
  build: {
    lib: {
      entry: "src/lib/playground.ts",
      formats: ["es"],
      name: "playground",
      fileName: "index",
    },
  },
  resolve: {
    alias: {
      "vite-plugin-node-polyfills": resolve(
        __dirname,
        "node_modules/vite-plugin-node-polyfills",
      ),
    },
  },
});
