import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const entries = readdirSync("samples");
const bundle = [];

for (const entry of entries) {
  const path = join("samples", entry);

  const stats = statSync(path);
  if (!stats.isDirectory()) continue;

  let sampleConfigText;
  try {
    sampleConfigText = readFileSync(join(path, "sample.json"));
  } catch (error) {
    if (error.code === "ENOENT") {
      continue;
    } else {
      throw error;
    }
  }

  const sampleConfig = JSON.parse(sampleConfigText);

  const files = [];

  for (const name of sampleConfig.files) {
    const text = readFileSync(join(path, name), "utf8");
    const ext = extname(name);
    const lang =
      {
        ".ts": "typescript",
        ".js": "javascript",
        ".html": "html",
        ".css": "css",
        ".json": "json",
      }[ext] ?? "plain";

    files.push({
      name,
      text,
      lang,
    });
  }

  bundle.push({
    name: entry,
    files,
  });
}

console.log(JSON.stringify(bundle));
