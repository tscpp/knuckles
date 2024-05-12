import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export default readdirSync("../../samples", { withFileTypes: true })
  .map((entry) => {
    if (!entry.isDirectory()) return;

    try {
      var text = readFileSync(
        join(entry.parentPath, entry.name, "sample.json"),
      );
    } catch (error) {
      if (error.code === "ENOENT") return;
      throw error;
    }
    const config = JSON.parse(text);

    const files = config.files.map((name) => {
      const text = readFileSync(
        join(entry.parentPath, entry.name, name),
        "utf8",
      );
      return { name, text };
    });

    return { name: entry.name, files };
  })
  .filter((v) => !!v);
