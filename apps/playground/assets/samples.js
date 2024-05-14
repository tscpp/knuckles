import { globbySync } from "globby";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export default readdirSync("../../samples", { withFileTypes: true })
  .map((entry) => {
    if (!entry.isDirectory()) return;
    const path = join(entry.parentPath, entry.name);

    try {
      var text = readFileSync(join(path, "sample.json"));
    } catch (error) {
      if (error.code === "ENOENT") return;
      throw error;
    }
    const config = JSON.parse(text);

    const files = Object.fromEntries(
      globbySync(config.include ?? "**/*", {
        ignore: [
          "**/node_modules/**",
          "**/sample.json/**",
          ...(config.exclude ?? []),
        ],
        cwd: path,
      }).map((name) => [name, readFileSync(join(path, name), "utf8")]),
    );

    return {
      name: entry.name,
      files,
      active: config.active,
      settings: config.settings,
    };
  })
  .filter((v) => !!v);
