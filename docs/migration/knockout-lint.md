# Migrating from knockout-lint

:::warning
`knockout-lint` is no longer maintained.
:::

<!-- @include: @/docs/parts/migration-intro.md -->

This guide will help you migrate your project to using [Knuckles analyzer](/docs/analyzer/overview).

## Improvements

- **Performance:** The new underlaying transpiler that converts views to TypeScript snapshots (code) have been improved and is significantly faster. From 300~700ms to about 80ms per file 🤯
- **Stabillity:** Stabillity of the tools have been improved by fixing bugs and refactoring code. Overall, the toolkit is much more stable than before and should be easier to use.
- **Additions:** Many new features have been introduced, including using external tools (such as ESLint) in bindings and optional/dynamic strictness for type-checking.

## Breaking Changes

Breaking changes include, but is not limited to:

- New minimum requirement of Node.JS version `>=18`.
- Packages are converted to ES modules, but can still be used in CommonJS projects.
- New hints [syntax](#syntax) (see below).

## Syntax

The syntax used by Knockout itself has not been changed (obviously), but the syntax used by the analyzer (previously linter) has.

- [Linking view models](#linking-view-models) <!-- no toc  -->
- [Defining binding handlers](#defining-binding-handlers)

### Linking View Models

You now link view models using the "with" directive. Notice the `#` before `ko` in the added code. The difference between Knockout's virtual elements and directives is that directives always start with `#`. Directives is the new (abstract) way to tell the analyzer (or other tools) about extra information.

:::tip

You may also notice the `/ko` end comment. This allows you to override the view model used for decendants.

:::

<!-- prettier-ignore -->
```html
<!-- ko-import ViewModel from './viewmodel.js' --> // [!code --]
<!-- ko-viewmodel ViewModel --> // [!code --]
<!-- ok with: default from './viewmodel.js' --> // [!code ++]
  ...
<!-- /ok --> // [!code ++]
```

### Defining Binding Handlers

We re-evaluated the decision to import binding handlers per view. Binding handlers are defined globally, in the `ko.bindingHandlers` namespace. If the binding handlers are defined globally (in a non-determenistic way), the binding handlers must be globally defined too.

:::details Q: So how do I limit which views can access what binding handlers?

You have to limit what binding handlers are globally defined in certain parts of your project. This can be done be not including declaration files that declare binding handlers that doesn't exist in the tsconfig used by the analyzer (which can be configured).

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
