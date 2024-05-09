---
layout: home
title: Knuckles
hero:
  name: Knuckles
  text: Development Toolkit for Knockout.js
  tagline: A cool set of development tools to enhance the usage of Knockout.js. Practically cheats.
  image:
    src: /knuckles-glow.svg
    alt: Knuckles Shield
  actions:
    - theme: brand
      text: Introduction
      link: /docs/introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/tscpp/knuckles
features:
  - icon: ⚠️
    title: Find context-aware issues
    details: The analyzer finds context-aware issues in Knockout bindings and enables you to run external tools on views using snapshots.
    link: /docs/analyzer/overview
    linkText: Learn about analyzer
  - icon:
      src: /typescript.svg
      width: 32
      height: 32
      wrap: true
    title: Extensive TypeScript support
    details: The analyzer plugin allows for type-checking and type-aware linting. The language server supports TypeScript language features.
    link: /docs/analyzer/typescript
    linkText: Add TypeScript to analyzer
  - icon: 🌠
    title: Boost performance using SSR
    details: The server-side renderer improves runtime performance by deferring client-side rendering and improves SEO.
    link: /docs/ssr/overview
    linkText: How does it work?
  - icon:
      src: /eslint.svg
      width: 32
      height: 32
      wrap: true
    title: Analyze using external tools
    details: The server-side renderer improves runtime performance by deferring client-side rendering and improves SEO.
    link: /docs/analyzer/eslint
    linkText: Add ESLint to analyzer
  - icon:
      src: /vscode.svg
      width: 32
      height: 32
      wrap: true
    title: Language support for editors
    details: The language server implementation allows you to have Knockout language features as an extension for editors.
    # link:
    linkText: Missing documentation # How to use code-splitting
  - icon: ✒️
    title: Formatting (comming soon)
    details: Provides the correct indentation for virtual elements and formats bindings over multiple lines.
    # link:
    linkText: Comming soon
---

<script setup>
import { 
  VPTeamPage,
  VPTeamPageTitle,
  VPTeamMembers,
  VPSponsors
} from 'vitepress/theme'

const members = [
  {
    avatar: 'https://www.github.com/yyx990803.png',
    name: 'Evan You',
    title: 'Creator',
    links: [
      { icon: 'github', link: 'https://github.com/yyx990803' },
      { icon: 'twitter', link: 'https://twitter.com/youyuxi' },
    ],
  },
];

const sponsors = [
  {
    tier: 'Sponsors',
    size: 'big',
    items: [
      {
        name: "Placeholder",
        img: "/heart.svg",
        url: "https://github.com/sponsors/tscpp",
      },
      {
        name: "Placeholder",
        img: "/heart.svg",
        url: "https://github.com/sponsors/tscpp",
      },
      {
        name: "Placeholder",
        img: "/heart.svg",
        url: "https://github.com/sponsors/tscpp",
      },
    ],
  }
];
</script>

<!-- <section>

<hgroup>

## Sponsors

Big thanks to our sponsors for keeping the project going!

</hgroup>

<VPSponsors mode='normal' :data="sponsors" />

</section> -->

<style scoped>
  section {
    border-top: 1px solid var(--vp-c-divider);
    margin-top: 5rem;
    padding-top: 5rem;
  }

  section .header-anchor {
    display: none;
  }

  hgroup {
    text-align: center;
    margin: 0;
    margin-bottom: 2rem;
    font-weight: 600;
  }

  hgroup h2 {
    font-size: 250%;
    border-top: none;
    margin: 0;
    margin-bottom: .5em;
    padding: 0;
    color: var(--vp-c-text-1);
  }

  hgroup p {
    font-size: 125%;
    margin: 0;
    color: var(--vp-c-text-2);
  }

  :global(.vp-sponsor) {
    max-width: 65rem;
    margin: 0 auto;
  }

  :global(.vp-sponsor-grid.big .vp-sponsor-grid-image) {
    max-height: 64px;
  }

  :global(.vp-sponsor-grid.big .vp-sponsor-grid-image[alt="Placeholder"]) {
    height: 64px;
    width: 64px;
    opacity: 0.5;
  }
</style>
