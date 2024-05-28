import { type AnalyzerPlugin } from "../plugin.js";
import rules from "./rules.js";
import { transpile } from "./transpile.js";

export default function (): AnalyzerPlugin {
  return {
    name: "standard",

    async analyze(c) {
      const chunk = transpile(c.document);
      const snapshot = chunk.snapshot(c.text);
      c.snapshots.javascript = snapshot;

      if (process.env["KO_PRINT_GENERATED_JAVASCRIPT_SNAPSHOT"] === "true") {
        process.stderr.write(snapshot.generated + "\n");
      }

      for (const module of rules) {
        module.check(c);
      }
    },
  };
}
