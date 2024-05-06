---
name: ssr
---

# Server-Side Rendering (SSR)

<!-- @include docs/parts/packages/ssr/description.md-->

The tool designed to enhance Knockout v3 applications by enabling server-side rendering (SSR) and Static Site Generation (SSG). It integrates easily into any build process and allows for gradual implementation without requiring a complete overhaul of your existing application.

<!-- /include -->

<!-- @include docs/parts/package-nav.md -->

[**Documentation**](https://knuckles.elsk.dev) | [Package (npm)](https://npmjs.com/package/@knuckles/ssr) | [Repository](https://github.com/tscpp/knuckles) | [Source Code](https://github.com/tscpp/knuckles/tree/main/packages/ssr)

<!-- /include -->

## Why?

While Knockout remains a simple yet powerful tool, it lags behind modern frameworks in certain features, particularly SSR. The tool bridges this gap, offering a straightforward solution to enhance your Knockout applications. This library significantly boosts SEO and allows for asynchronous hydration, which significantly improves load speeds.

## How does it work?

The library parses HTML documents to identify Knockout-specific binding attributes and virtual elements. It then server-renders these bindings by executing the binding values as JavaScript, utilizing the corresponding viewmodel.

Leveraging Knockout's MVVM pattern, which relies on underlying data models, the tool allows for the creation of isomorphic viewmodels operative on both server and client sides, or distinct server-side viewmodels. Client-side, you can use applyBindings as usual for correct view hydration. For enhanced performance, consider asynchronously executing applyBindings to reduce JavaScript blocking and improve page load times.

<!-- @include docs/parts/reference.md -->

[TypeScript]: https://typescriptlang.org
[ESLint]: https://eslint.org
[Knockout]: https://knockoutjs.com
[toolchain]: https://knuckles.elsk.dev

<!-- /include -->
