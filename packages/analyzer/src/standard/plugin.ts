import { type AnalyzerPlugin } from "../plugin.js";
import { Snapshot } from "../snapshot.js";
import rules from "./rules.js";
import { transpile } from "./transpile.js";

export default function (): AnalyzerPlugin {
  return {
    name: "standard",

    async analyze(c) {
      const chunk = transpile(c.document);
      const snapshot = new Snapshot({
        fileName: c.fileName + ".js",
        generated: chunk.content,
        original: c.text,
        mappings: chunk.getMappings(c.text),
      });
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
