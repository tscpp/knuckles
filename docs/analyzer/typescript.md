# TypeScript

## Introduction

### What is this?

Knuckles (the toolkit) offers an official plugin for the analyzer, enabling type-checking of bindings in Knockout views using TypeScript. This helps identify type errors and undeclared properties in your views.

<!-- prettier-ignore -->
```html
<p data-bind="text: myNumber"></p>
                    ~~~~~~~~
Type 'number' is not assignable to parameter of type 'string'.
```

### How does it work?

By providing a type declaration of the viewmodel and adding a [hint](/docs/reference/hints) for its path, the analyzer recognizes the properties defined in the viewmodel. If you use undeclared properties or pass incorrect types to binding handlers, the analyzer will flag an issue.

<!-- prettier-ignore -->
```html
<!-- ok with: default from "./path/to/viewmodel" --> // [!code ++]
  <p data-bind="text: myTex"></p>
                      ~~~~~
  Cannot find name 'myTex'. Did you mean 'myText'?
<!-- /ok --> // [!code ++]
```

See more about how to [importing view models](#importing-view-models).

## Setup

::: code-group

```sh [npm]
# Make sure you have the CLI installed.
$ npm install --save-dev @knuckles/cli

# This will configure the analyzer and typescript for you.
$ npx ko add analyzer typescript
```

```sh [yarn]
# Make sure you have the CLI installed.
$ yarn add --dev @knuckles/cli

# This will configure the analyzer and typescript for you.
$ yarn ko add analyzer typescript
```

```sh [pnpm]
# Make sure you have the CLI installed.
$ pnpm add --save-dev @knuckles/cli

# This will configure the analyzer and typescript for you.
$ pnpm ko add analyzer typescript
```

```sh [bun]
# Make sure you have the CLI installed.
$ bun add --save-dev @knuckles/cli

# This will configure the analyzer and typescript for you.
$ bun ko add analyzer typescript
```

:::

## Usage

### Importing View Models

Knuckles (the toolkit) provides an universal syntax for providing additional insights to the view called [hints](/docs/reference/hints.md). Notice the below comment starts with "ok" instead of "ko".

The "with" hint is used to provide view models. Look at the below examples for details. The imported view model can be a factory (class or function) or a singleton object. You can also configure custom interop for other solutions.

<!-- prettier-ignore -->
```html
<!-- ok with: ... --> // [!code ++]
  ...
<!-- /ok --> // [!code ++]
```

#### Examples:

:::details Ex: default import

**View Model:**

```ts
export default ViewModel;
```

**View:**

<!-- prettier-ignore -->
```html
<!-- ok with: default from "./path/to/viewmodel" -->
  ...
<!-- /ok -->
```

:::

:::details Ex: named import

**View Model:**

```ts
export { ViewModel };
```

**View:**

<!-- prettier-ignore -->
```html
<!-- ok with: { ViewModel } from "./path/to/viewmodel" -->
  ...
<!-- /ok -->
```

:::

:::details Ex: '\*' import (CJS)

**View Model:**

```ts
export = ViewModel;
```

**View:**

<!-- prettier-ignore -->
```html
<!-- ok with: * from "./path/to/viewmodel" -->
  ...
<!-- /ok -->
```

:::

:::details Ex: type-only import

<!-- prettier-ignore -->
```html
<!-- ok with: type default from "./path/to/viewmodel" -->
  ...
<!-- /ok -->
```

:::

### Declaring Custom Binding Handlers

:::warning
If you declare the binding in a module (a file with exports), you need to wrap the declaration in a `declare global` block. See TypeScript official documentation about [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#global-augmentation).
:::

```ts
ko.bindingHandlers.customHandler = ...;

namespace Knuckles { // [!code ++]
  export interface Bindings { // [!code ++]
    customHandler: Binding< // [!code ++]
      /* input value */, // [!code ++]
      /* allowed nodes */ // [!code ++]
    >; // [!code ++]
  } // [!code ++]
} // [!code ++]
```

#### Examples:

:::details Ex: simple binding

```ts
namespace Knuckles {
  export interface Bindings {
    text: Binding<string>;
  }
}
```

:::

:::details Ex: restricting allowed nodes

```ts
namespace Knuckles {
  export interface Bindings {
    value: Binding<string, HTMLInputElement>;
  }
}
```

:::

:::details Ex: custom child context

```ts
namespace Knuckles {
  export interface Bindings {
    with: <T extends object, C extends Ctx>(
      n: Comment | Element,
      v: T | ko.Observable<T>,
      c: C,
    ) => Overwrite<
      C,
      {
        $parentContext: C;
        $parents: [C["$data"], ...C["$parents"]];
        $parent: C["$data"];
        $root: C["$root"];
        $data: ko.Unwrapped<T>;
        $rawData: T;
      }
    >;
  }
}
```

:::

### Custom Module Interop

You can configure the algrothim applied to the typing declaration of imported view models.

```ts
namespace Knuckles {
  export interface Settings {
    interop: 'custom';
  }

  export type CustomInterop<T> = ...;
}
```
