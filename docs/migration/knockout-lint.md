# Migrating from knockout-lint

:::warning
Knuckles has taken `knockout-lint`'s place which is no longer maintained.
:::

<!-- @include: @/docs/parts/migration-intro.md -->

This guide will help you migrate your project to using [Knuckles analyzer](/docs/analyzer/overview).

## Improvements

- **Performance:** The new underlaying transpiler that converts views to TypeScript snapshots (code) have been improved and is significantly faster. From 300~700ms to about 80ms per file 🤯
- **Stabillity:** Stabillity of the tools have been improved by fixing bugs and refactoring code. Overall, the toolkit is much more stable than before and should be easier to use.
- **Additions:** Many new features have been introduced, including using external tools (such as TypeScript and ESLint) in bindings and optional/dynamic strictness for type-checking.

## Breaking Changes

Breaking changes include, but is not limited to:

- New minimum requirement of Node.JS version `>=18`.
- Packages are converted to ES modules, but can still be used in CommonJS projects.
- New [syntax](#syntax) (see below).

## Installation

::: code-group

```sh [npm]
# Make sure you have the CLI installed.
$ npm install --save-dev @knuckles/cli

# This will configure the analyzer and typescript for you.
$ npx ko add typescript
```

```sh [yarn]
# Make sure you have the CLI installed.
$ yarn add --dev @knuckles/cli

# This will configure the analyzer and typescript for you.
$ yarn ko add typescript
```

```sh [pnpm]
# Make sure you have the CLI installed.
$ pnpm add --save-dev @knuckles/cli

# This will configure the analyzer and typescript for you.
$ pnpm ko add typescript
```

```sh [bun]
# Make sure you have the CLI installed.
$ bun add --save-dev @knuckles/cli

# This will configure the analyzer and typescript for you.
$ bun ko add typescript
```

:::

See the ['getting started' guide](/docs/getting-started) and [analyzer overview](/docs/analyzer/overview).

## Syntax

The syntax used by Knockout itself has not been changed (obviously), but the syntax used by the analyzer (previously linter) has.

- [Linking view models](#linking-view-models) <!-- no toc  -->
- [Defining binding handlers](#defining-binding-handlers)

### Linking View Models

Linking view models is now done through [hints](/docs/reference/hints). Hints always start with "ok" (instead of "ko"). Hints provide various insights about the view, and the "with" directive provides the data for the [descendant](/docs/reference/glossary#descendant) context.

See the full [view hint reference](/docs/reference/hints#with) for more details.

<!-- prettier-ignore -->
```html
<!-- ko-import ViewModel from './viewmodel.js' --> // [!code --]
<!-- ko-viewmodel ViewModel --> // [!code --]
<!-- ok with: default from './viewmodel.js' --> // [!code ++]
  ...
<!-- /ok --> // [!code ++]
```

### Defining Binding Handlers

Binding handlers are now defined globally, in the `ko.bindingHandlers` namespace. Since the binding handlers are defined globally (in a non-determenistic way), the binding handlers must also be defined globally.

:::details Q: So how do I limit which views can access what binding handlers?

You have to limit what binding handlers are globally defined in certain parts of your project. This can be done by not including declaration files that declare binding handlers that doesn't exist in the tsconfig used by the analyzer (which can be configured). [Ask](https://github.com/tscpp/knuckles/discussions) if you have questions.

:::

This is how you would define a binding transform globally. After this is defined globally, the view can automatically use the binding handler.

```ts
import { KnucklesIdentityBindingTransform } from "@knuckles/typescript/types";

declare global {
  interface KnucklesBindingTransforms {
    i18n: KnucklesIdentityBindingTransform<string>; // [!code ++]
  }
}
```

## What's next?

If you have any questions, feel free to [start a discussion](https://github.com/tscpp/knuckles/discussions).

- [Getting started](/docs/getting-started)
- [Analyzer overview](/docs/analyzer/overview)
  - [Using TypeScript](/docs/analyzer/typescript)
  - [Using ESLint](/docs/analyzer/eslint)
