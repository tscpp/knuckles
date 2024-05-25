import { readFileSync } from "node:fs";

export default {
  paths() {
    return Object.entries(
      JSON.parse(readFileSync("docs/redirects.json", "utf8")),
    ).map(([id, url]) => ({ params: { id, url } }));
  },
};
