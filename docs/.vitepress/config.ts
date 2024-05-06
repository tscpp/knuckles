import { ThemeConfig } from "./theme";
import escapeStringRegexp from "escape-string-regexp";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { UserConfig } from "vitepress";
import footnote from "markdown-it-footnote";

// https://vitepress.dev/reference/site-config
const config: UserConfig<ThemeConfig> = {
  title: "Knuckles",
  base: "/next/",
  lastUpdated: true,

  // prettier-ignore
  head: [
    ['link', { rel: 'apple-touch-icon', sizes: "180x180", href: "/apple-touch-icon.png" }],
    ['link', { rel: 'icon', type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" }],
    ['link', { rel: 'icon', type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" }],
  ],

  themeConfig: {
    logo: "/logo.png",
    search: { provider: "local" },
    editLink: {
      pattern: "https://github.com/tscpp/knuckles/edit/main/docs/:path",
    },

    nav: [
      //
      { text: "Guide", link: "/guide/intro" },
      { text: "Packages", link: "/packages/index" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Toolchain",
          base: "/guide/",
          items: [
            //
            { text: "Introduction", link: "intro" },
            { text: "Configuration", link: "config" },
          ],
        },
        {
          text: "Analyzer 🛡️",
          base: "/guide/analyzer/",
          items: [
            //
            { text: "Introduction", link: "intro" },
            { text: "Getting Started", link: "setup" },
            { text: "Usage", link: "usage" },
            { text: "Configuration", link: "config" },
          ],
        },
        {
          text: "Server-Side Rendering",
          base: "/guide/ssr/",
          items: [
            //
            { text: "Introduction", link: "intro" },
            { text: "Getting Started", link: "setup" },
            { text: "Usage", link: "usage" },
            { text: "Support", link: "support" },
            { text: "Plugins", link: "plugins" },
          ],
        },
        {
          text: "Editors",
          items: [
            {
              text: "VSCode Extension",
              link: "/guide/editors/vscode",
            },
          ],
        },
        {
          text: "Development",
          items: [
            //
            { text: "Contributing", link: "/guide/contributing" },
          ],
        },
      ],
      "/package": [
        {
          text: "Documentation",
          items: readdirSync("packages").map((name) => {
            return {
              text: name,
              link: `/packages/readme/${name}`,
            };
          }),
        },
        {
          text: "Changelogs",
          items: readdirSync("packages").map((name) => {
            return {
              text: name,
              link: `/packages/changelog/${name}`,
            };
          }),
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/tscpp/knuckles" },
    ],

    footer: {
      links: [
        {
          text: "Repository",
          link: "https://github.com/tscpp/knuckles",
        },
        {
          text: "Releases",
          link: "https://github.com/tscpp/knuckles/releases",
        },
        {
          text: "Documentation",
          link: "/intro",
        },
      ],
      disclaimer:
        "Released under MIT License | Copyright © 2024 Elias Skogevall",
    },
  },

  markdown: {
    config: (md) => {
      md.use(footnote);
    },
  },

  vite: {
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
