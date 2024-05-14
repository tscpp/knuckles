import { ThemeConfig } from "../apps/website/.vitepress/theme";
import { readdirSync } from "node:fs";

const config: ThemeConfig = {
  logo: "/knuckles-sharp.svg",
  search: { provider: "local" },
  editLink: {
    pattern: "https://github.com/tscpp/knuckles/edit/main/docs/:path",
  },

  nav: [
    {
      text: "Docs",
      link: "/docs/introduction",
      activeMatch: "/docs/",
    },
    {
      text: "Playground",
      link: "/playground",
    },
    {
      text: "Packages",
      link: "/packages/index",
      activeMatch: "/packages/",
    },
  ],

  sidebar: {
    "../../docs/": [
      {
        text: "Toolkit",
        collapsed: false,
        base: "/docs/",
        items: [
          //
          { text: "What is Knuckles?", link: "introduction" },
          { text: "Getting started", link: "getting-started" },
        ],
      },
      {
        text: "Analyzer",
        collapsed: false,
        base: "/docs/analyzer/",
        items: [
          //
          { text: "Overview", link: "overview" },
          { text: "Setup", link: "setup" },
          { text: "TypeScript", link: "typescript" },
          { text: "ESLint", link: "eslint" },
        ],
      },
      {
        text: "SSR",
        collapsed: false,
        base: "/docs/ssr/",
        items: [
          //
          { text: "Overview", link: "overview" },
          { text: "Setup", link: "setup" },
          { text: "Support", link: "support" },
          { text: "Plugins", link: "plugins" },
        ],
      },
      {
        text: "Migration",
        collapsed: false,
        base: "/docs/migration/",
        items: [
          //
          { text: "From knockout-lint", link: "knockout-lint" },
          { text: "From knockout-ssr", link: "knockout-ssr" },
        ],
      },
      {
        text: "Reference",
        base: "/docs/reference/",
        collapsed: false,
        items: [
          //
          { text: "Glossary", link: "glossary" },
          { text: "Hints", link: "hints" },
          {
            text: "Configuration",
            base: "/docs/reference/config/",
            link: "overview",
            items: [
              //
              { text: "Analyer", link: "analyzer" },
            ],
          },
        ],
      },
      {
        text: "Development",
        collapsed: false,
        items: [
          //
          { text: "Contributing", link: "/docs/development/contributing" },
          { text: "Repository", link: "https://github.com/tscpp/knuckles" },
        ],
      },
      {
        text: "Reference & Configuration",
        link: "/docs/reference/overview",
      },
      {
        text: "Feedback",
        link: "https://github.com/tscpp/knuckles/discussions",
      },
    ],
    "./packages/": [
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

  socialLinks: [{ icon: "github", link: "https://github.com/tscpp/knuckles" }],

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
};
export default config;
