# Installation

The package supports NodeJS compatible runtimes.

::: code-group

```sh [npm]
$ npm add -D @knuckles/analyzer
```

```sh [pnpm]
$ pnpm add -D @knuckles/analyzer
```

```sh [yarn]
$ yarn add -D @knuckles/analyzer
```

```sh [bun]
$ bun add -D @knuckles/analyzer
```

:::

## TypeScript

The linter depends on TypeScript as a [peer dependency](https://nodejs.org/en/blog/npm/peer-dependencies); Meaning that you can configure which version of TypeScript to use. Ensure you have it installed.

::: code-group

```sh [npm]
$ npm add -D typescript
```

```sh [pnpm]
$ pnpm add -D typescript
```

```sh [yarn]
$ yarn add -D typescript
```

```sh [bun]
$ bun add -D typescript
```

:::

## Usage

After you have [linked a viewmodel](#viewmodels) to a view, you can lint the file. You can choose to pass a directory or file to `knuckles analyze`.

:::tip
See `knuckles analyze --help` for all flags. You can also choose to [create a config file](/linting/config).
:::

::: code-group

```sh [npm]
$ npx knuckles analyze [options] [...paths]
```

```sh [pnpm]
$ pnpm knuckles analyze [options] [...paths]
```

```sh [yarn]
$ yarn knuckles analyze [options] [...paths]
```

```sh [bun]
$ bun knuckles analyze [options] [...paths]
```

:::
