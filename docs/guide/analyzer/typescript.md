# TypeScript Plugin

The [TypeScript] plugin allows you to type-check views using the [analyzer]. The plugin also provides the TypeScript snapshot, which may be required by other plugins.

## Installation

::: code-group

```sh [npm]
$ npm add --save-dev @knuckles/typescript
```

```sh [yarn]
$ yarn add --dev @knuckles/typescript
```

```sh [pnpm]
$ pnpm add --save-dev @knuckles/typescript
```

```sh [bun]
$ bun add --save-dev @knuckles/typescript
```

:::

## Setup

The TypeScript plugin will be automatically configured if the `--ts` flag is passed.

```sh
$ ko analyze [paths...] --ts
```

### Configuration

Alternativly, you can configure the plugin in the [configuration](/guide/config).

<!-- prettier-ignore -->
```js
import typescript from "@knuckles/typescript/analyzer";

export default {
  analyzer: {
    plugins: [
      typescript() // [!code ++]
    ],
  },
};
```

## View Model Types

You have to provide the type declartion for the data used within a view. See the [view model hint guide](/guide/hints/view-model).

:::tip Examples

---

Using the type declaration provided from the import.

```html
<!-- #ko with: default from './viewmodel' -->
```

---

Alternativly if the type declaration are not included in the import, you can add an additional hint.

```html
<!-- #ko with: type default from './viewmodel' -->
```

:::

[TypeScript]: https://typescriptlang.org/
[analyzer]: /guide/analyzer/overview
