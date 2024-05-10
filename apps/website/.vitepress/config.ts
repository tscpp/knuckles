import { ThemeConfig } from "./theme";
import escapeStringRegexp from "escape-string-regexp";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { UserConfig } from "vitepress";
import footnote from "markdown-it-footnote";
import themeConfig from "../../../docs/vitepress.config.js";

// https://vitepress.dev/reference/site-config
const config: UserConfig<ThemeConfig> = {
  title: "Knuckles",
  base: "/",
  lastUpdated: true,

  head: [
    [
      "link",
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
    ],
    [
      "link",
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
    ],
    [
      "link",
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png",
      },
    ],
    [
      "script",
      {
        src: "https://api.pirsch.io/pa.js",
        defer: "",
        id: "pianjs",
        "data-code": "aPZ05TdxBbcnBLbX51IweJNb1Kd7UU78",
        "data-dev": "knuckles.elsk.dev",
      },
    ],
  ],

  themeConfig,

  markdown: {
    config: (md) => {
      md.use(footnote);
    },
  },

  vite: {
    optimizeDeps: {
      exclude: ["@apps/playground"],
    },
    resolve: {
      alias: readdirSync(
        fileURLToPath(new URL("./theme/components/", import.meta.url)),
        { withFileTypes: true },
      )
        .filter((entry) => entry.isFile() && entry.name.endsWith(".vue"))
        .map((entry) => ({
          find: new RegExp(`^.*\\/${escapeStringRegexp(entry.name)}$`),
          replacement: join(entry.path, entry.name),
        })),
    },
  },
};
export default config;
