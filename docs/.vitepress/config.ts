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
  base: "/",
  lastUpdated: true,

  // prettier-ignore
  head: [
    ['link', { rel: 'apple-touch-icon', sizes: "180x180", href: "/apple-touch-icon.png" }],
    ['link', { rel: 'icon', type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" }],
    ['link', { rel: 'icon', type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" }],
  ],

  themeConfig: {
    logo: "/logo.svg",
    search: { provider: "local" },
    editLink: {
      pattern: "https://github.com/tscpp/knuckles/edit/main/docs/:path",
    },

    nav: [
      //
      { text: "Guide", link: "/guide/introduction" },
      { text: "Packages", link: "/packages/index" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Toolkit",
          collapsed: false,
          base: "/guide/",
          items: [
            //
            { text: "What is Knuckles?", link: "introduction" },
            { text: "Getting started", link: "getting-started" },
          ],
        },
        {
          text: "Configuration",
          collapsed: true,
          base: "/guide/",
          items: [
            //
            { text: "Overview", link: "config" },
            { text: "Analyer", link: "analyzer/config" },
          ],
        },
        {
          text: "Hints",
          collapsed: true,
          base: "/guide/",
          items: [
            //
            { text: "Overview", link: "hints/overview" },
            { text: "View Model", link: "hints/view-model" },
          ],
        },
        {
          text: "Analyzer",
          collapsed: true,
          base: "/guide/analyzer/",
          items: [
            //
            { text: "Overview", link: "overview" },
            { text: "Setup", link: "setup" },
            { text: "Configuration", link: "config" },
            { text: "TypeScript", link: "typescript" },
            { text: "ESLint", link: "eslint" },
          ],
        },
        {
          text: "Server-side Rendering",
          collapsed: true,
          base: "/guide/ssr/",
          items: [
            //
            { text: "Overview", link: "overview" },
            { text: "Setup", link: "setup" },
            { text: "Support", link: "support" },
            { text: "Plugins", link: "plugins" },
          ],
        },
        {
          text: "Editors",
          collapsed: true,
          items: [
            //
            { text: "VSCode Extension", link: "/guide/editors/vscode" },
          ],
        },
        {
          text: "Migration",
          collapsed: true,
          base: "/guide/migration/",
          items: [
            //
            { text: "From knockout-lint", link: "knockout-lint" },
            { text: "From knockout-ssr", link: "knockout-ssr" },
          ],
        },
        {
          text: "Development",
          collapsed: true,
          items: [
            //
            { text: "Contributing", link: "/guide/development/contributing" },
            { text: "Repository", link: "https://github.com/tscpp/knuckles" },
          ],
        },
        {
          items: [
            //
            {
              text: "Feedback",
              link: "https://github.com/tscpp/knuckles/discussions",
            },
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
          link: "/overview",
        },
        {
          text: "Sponsor ❤️",
          link: "https://github.com/sponsors/tscpp",
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
