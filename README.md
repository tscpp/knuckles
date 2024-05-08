# [Knuckles](https://knuckles.elsk.dev/)

**The modern toolkit for enhancing usage of Knockout.js and improving runtime performance. [Read more ›](https://knuckles.elsk.dev/)**

## Analyzer

<!-- @include docs/parts/packages/analyzer/description.md -->

The analyzer is a tool in the [toolkit] that can check [Knockout] views for issue. It can utilize existing tools like [TypeScript] and [ESLint], while also providing a set of standard rules to help catch common issue or styling.

<!-- /include -->

<div align="center">

[Read more ›](https://knuckles.elsk.dev/analyzer/overview)

</div>

<!-- @include docs/parts/features/analyzer/gh-example.md -->

<!-- prettier-ignore -->
```html
<p data-bind="visible: isVisible"></p>
                       ^^^^^^^^^
Argument of type 'number' is not assignable to parameter of type 'boolean'.
```

<!-- /include -->

## Server-side Rendering

<!-- @include docs/parts/packages/ssr/description.md -->

The tool designed to enhance Knockout v3 applications by enabling server-side rendering (SSR) and Static Site Generation (SSG). It integrates easily into any build process and allows for gradual implementation without requiring a complete overhaul of your existing application.

<!-- /include -->

<div align="center">

[Read more ›](https://knuckles.elsk.dev/guide/ssr/overview)

</div>

<!-- @include docs/parts/features/ssr/gh-example.md -->

<!-- prettier-ignore -->
```diff
- <!-- ko foreach: users -->
-   <p>{name}</p>
- <!-- /ko -->
+ <p>John Doe</p>
+ <p>Albert Einstein</p>
```

<!-- /include -->

## Language Support

<!-- @include docs/parts/packages/analyzer/description.md -->

The analyzer is a tool in the [toolkit] that can check [Knockout] views for issue. It can utilize existing tools like [TypeScript] and [ESLint], while also providing a set of standard rules to help catch common issue or styling.

<!-- /include -->

<div align="center">

[Read more ›](https://knuckles.elsk.dev/guide/ssr/overview)

</div>
