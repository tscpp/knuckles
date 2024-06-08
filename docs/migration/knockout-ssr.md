# Migrating from knockout-ssr

:::warning
Knuckles has taken `knockout-ssr`'s place which is no longer maintained.
:::

<!-- @include: @/docs/parts/migration-intro.md -->

This guide will help you migrate your project to using [Knuckles SSR](/docs/ssr/overview).

## Improvements

- **Stabillity:** Stabillity of the tools have been improved by fixing bugs and refactoring code. Overall, the toolkit is much more stable than before and should be easier to use.
- **Conventions:** Knuckles provides a universal syntax to provide hints. This makes adopting other tools much easier, but is still optional.

## Breaking Changes

### Linking View Models

Knuckles introduces an universal way to link view models to the decendants binding context using the ['with' hint](/docs/reference/hints#with).

<!-- prettier-ignore -->
```html
<!-- ko ssr: './viewmodel.js' --> // [!code --]
<!-- ok with: default from './viewmodel.js' --> // [!code ++]
  ...
<!-- /ok -->
```

### Toggle Rendering

You can [configure](/docs/ssr/config) the SSR to render by default, or by explicitly enabling for certain parts of the project, like in the example below.

<!-- prettier-ignore -->
```html
<!-- ok ssr: true --> // [!code ++]
  ...
<!-- /ok --> // [!code ++]
```

## What's next?

If you have any questions, feel free to [start a discussion](https://github.com/tscpp/knuckles/discussions).

- [Getting started](/docs/getting-started)
- [SSR overview](/docs/ssr/overview)
