---
next: "Overview | Analyzer"
---

# Getting Started!

:::tip Migration

See the guides for migrating from other tools:

- [knockout-lint](/docs/migration/knockout-lint)
- [knockout-ssr](/docs/migration/knockout-ssr)

:::

## Supported Runtimes

- **Node.js**: `v18` or later
- **Bun**: `v1` or later

## Installation

:::code-group

```sh [npm]
$ npm install --save-dev @knuckles/cli
```

```sh [yarn]
$ yarn add --dev @knuckles/cli
```

```sh [pnpm]
$ pnpm add --save-dev @knuckles/cli
```

```sh [bun]
$ bun add --save-dev @knuckles/cli
```

:::

### Globally (optional)

It is recommend to install the command-line globally to use the `ko` binary anywhere. The local installation will still be used internally.

:::code-group

```sh [npm]
$ npm install --save-dev --global @knuckles/cli
```

```sh [yarn]
$ yarn add --dev --global @knuckles/cli
```

```sh [pnpm]
$ pnpm add --save-dev --global @knuckles/cli
```

```sh [bun]
$ bun add --save-dev --global @knuckles/cli
```

:::

## Usage

:::warning
If you have not installed the command-line [globally](#globally-optional), you need to make sure to run the `ko` binary with your package manager.
:::

```sh
$ ko --help
```

## What's next?

See setup guides for:

- [Analyzer](/docs/analyzer/setup)
  - [TypeScript](/docs/analyzer/typescript)
  - [ESLint](/docs/analyzer/eslint)
- [Server-side Render (SSR)](/docs/analyzer/setup)
