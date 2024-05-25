# Analyzer

## Introduction

### What is this?

The analyzer allows you to find issues in your Knockout views (in HTML) build-time. The analyzer provides a set of predefined rules that helps you find common misstakes or enforce code style. You can also configure external tools such as [TypeScript](/docs/analyzer/typescript) and [ESLint](/docs/analyzer/eslint) to lint directly on the views.

<!-- prettier-ignore -->
```html
<p data-bind="events: ..."></p>
              ~~~~~~
Binding handler "events" is not defined. Did you mean "event"?
```

## Setup

::: code-group

```sh [npm]
# Make sure you have the CLI installed.
$ npm install --save-dev @knuckles/cli

# This will configure the analyzer for you.
$ npx ko add analyzer
```

```sh [yarn]
# Make sure you have the CLI installed.
$ yarn add --dev @knuckles/cli

# This will configure the analyzer for you.
$ yarn ko add analyzer
```

```sh [pnpm]
# Make sure you have the CLI installed.
$ pnpm add --save-dev @knuckles/cli

# This will configure the analyzer for you.
$ pnpm ko add analyzer
```

```sh [bun]
# Make sure you have the CLI installed.
$ bun add --save-dev @knuckles/cli

# This will configure the analyzer for you.
$ bun ko add analyzer
```

:::

## Usage

::: code-group

```sh [npm]
$ npx ko analyze --help
```

```sh [yarn]
$ yarn ko analyze --help
```

```sh [pnpm]
$ pnpm ko analyze --help
```

```sh [bun]
$ bun ko analyze --help
```

:::

## Whats next?

- [Check out standard rules](/docs/analyzer/rules)
- [Configure TypeScript](/docs/analyzer/typescript)
- [Configure ESLint](/docs/analyzer/eslint)
