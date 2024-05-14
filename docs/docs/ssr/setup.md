# Setup

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

## Adding Hints

You need to add hints to the view so the renderer know what data to render. This can be done trough the `with` binding, or by using the [view model hint](/docs/reference/hints.html#view-model-hint)

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
