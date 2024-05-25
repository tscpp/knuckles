# Server-side Rendering

## Introduction

`@knuckles/ssr` is a tool designed to enhance Knockout v3 applications by enabling server-side rendering (SSR) and Static Site Generation (SSG). It integrates easily into any build process and allows for gradual implementation without requiring a complete overhaul of your existing application.

### Why?

While Knockout remains a simple yet powerful tool, it lags behind modern frameworks in certain features, particularly SSR. `@knuckles/ssr` bridges this gap, offering a straightforward solution to enhance your Knockout applications. This library significantly boosts SEO and allows for asynchronous hydration, which significantly improves load speeds.

### How does it work?

The library parses HTML documents to identify Knockout-specific binding attributes and virtual elements. It then server-renders these bindings by executing the binding values as JavaScript, utilizing the corresponding viewmodel.

Leveraging Knockout's MVVM pattern, which relies on underlying data models, `@knuckles/ssr` allows for the creation of isomorphic viewmodels operative on both server and client sides, or distinct server-side viewmodels. Client-side, you can use applyBindings as usual for correct view hydration. For enhanced performance, consider asynchronously executing applyBindings to reduce JavaScript blocking and improve page load times.

## Setup

::: code-group

```sh [npm]
$ npm install --save-dev @knuckles/ssr
```

```sh [yarn]
$ yarn add --dev @knuckles/ssr
```

```sh [pnpm]
$ pnpm add --save-dev @knuckles/ssr
```

```sh [bun]
$ bun add --save-dev @knuckles/ssr
```

:::

## Usage

:::warning
The command-line interface for SSR is subject change. Expect to see updates ([#10]) soon 👀
:::

```sh
$ ko ssr -i view.html -o out/
```

### Adding Hints

You need to add hints to the view so the renderer know what data to render.

<!-- prettier-ignore -->
```html
<!-- ok with: default from './viewmodel' --> // [!code ++]
  <p data-bind="text: message"></p>
<!-- /ok --> // [!code ++]
```

To enable rendering, you either need to explicitly specify the "ssr" hint in the view, or configure SSR to render by default

<!-- prettier-ignore -->
```html
<!-- ok with: default from './viewmodel' -->
  <!-- ok ssr: --> // [!code ++]
    <p data-bind="text: message"></p>
  <!-- /ok --> // [!code ++]
<!-- /ok -->
```

### Hydrating Server-side Rendered Views

The server-side rendered views requires custom hydration for some bindings. Import the `@knuckles/ssr/runtime` module globally in your applications. The module will register all ssr binding handlers once it is loaded.

```js
import "@knuckles/ssr/runtime";
```

Once the binding handlers are registered, you can run `applyBindings` as normally.

```js
ko.applyBindings(...);
```

### Build tools

`@knuckles/ssr` is pre-equipped with integrations for various build tools. See below for the complete list of supported build tools. For other tools or custom build processes, use the API (undocumented).

- [Rollup](https://rollupjs.org/) - `@knuckles/ssr/rollup`
- [Vite](https://vitejs.dev/) - `@knuckles/ssr/vite`
- [Webpack](https://webpack.js.org/) - `@knuckles/ssr/`

[#10]: https://github.com/tscpp/knuckles/issues/10
