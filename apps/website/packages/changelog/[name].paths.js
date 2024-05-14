import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export default {
  paths() {
    return readdirSync("../../packages", { withFileTypes: true }).map(
      (entry) => {
        const path = join(entry.path, entry.name, "CHANGELOG.md");
        let content = `_Missing file \`${path}\`._`;
        try {
          content = readFileSync(path, "utf8");
        } catch (error) {
          if (error.code !== "ENOENT") {
            throw error;
          }
        }
        return { params: { name: entry.name }, content };
      },
    );
  },
};
