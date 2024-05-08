# Migrating from knockout-ssr

:::warning
`knockout-ssr` is no longer maintained.
:::

<!-- @include: @/parts/migration-intro.md -->

This guide will help you migrate your project to using [Knuckles SSR](/guide/ssr/overview).

## Improvements

- **Stabillity:** Stabillity of the tools have been improved by fixing bugs and refactoring code. Overall, the toolkit is much more stable than before and should be easier to use.
- **Conventions:** Knuckles provides a universal syntax to provide hints. This makes adopting other tools much easier, but is still optional.

## Breaking Changes

### Linking View Models

Knuckles introduces an universal way to link view models to the decendants binding context using the ['with' directive](#).

<!-- prettier-ignore -->
```html
<!-- ko ssr: './viewmodel.js' --> // [!code --]
<!-- #ko with: default from './viewmodel.js' --> // [!code ++]
  ...
<!-- /ko -->
```


### Toggle Rendering

You can [configure](/guide/ssr/config) the SSR to render by default, or by explicitly enabling for certain parts of the project.

<!-- prettier-ignore -->
```
<!-- ko ssr: './viewmodel.js' --> // [!code --]
<!-- #ko with: default from './viewmodel.js' -->
  <!-- #ko ssr --> // [!code ++]
    ...
  <!-- /ko --> // [!code ++]
<!-- /ko -->
```
