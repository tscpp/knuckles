# Installation

The library runs in [Node.JS](https://nodejs.org/) which is required to be installed prior.

The library is shipped as a package on [npm](https://www.npmjs.com/package/@knuckles/ssr). You can add the library as a dev-dependency by running the below command.

::: code-group

```sh [npm]
$ npm add -D @knuckles/ssr
```

```sh [pnpm]
$ pnpm add -D @knuckles/ssr
```

```sh [yarn]
$ yarn add -D @knuckles/ssr
```

```sh [bun]
$ bun add -D @knuckles/ssr
```

:::

## Integration

`@knuckles/ssr` strives to integrate easily into any application, with as little modifications and tweaking as possible. `@knuckles/ssr` will scan the document for "ssr" virtual elements. These special elements indicates to `@knuckles/ssr` to start server-side rendering, as well as providing the data used for the decendants.

```html
<!-- ko ssr: { message: "Hello world!" } -->
<p data-bind="text: message"></p>
<!-- /ko -->
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

### Using Data From Modules (View Models)

The special "ssr" virtual element allows for a module path to be provided. It will import the module and try to interoperate the data from the module.

```html
<!-- ko ssr: ./my-viewmodel.js -->
...
<!-- /ko -->
```

The module specified should be capable of running server-side. You have two options for this:

1. Isomorphic Modules: The module is designed to run both on the browser and server-side. You should opt for isomorphic modules when possible.
2. Exclusive Modules: Alternatively, modules can be created to exclusively run server-side.

### Build tools

`@knuckles/ssr` is pre-equipped with integrations for various build tools. See below for the complete list of supported build tools. For other tools or custom build processes, use either the [CLI](#cli) or [API](#api).

- [Rollup](https://rollupjs.org/) - `@knuckles/ssr/rollup`
- [Vite](https://vitejs.dev/) - `@knuckles/ssr/vite`
- [Webpack](https://webpack.js.org/) - `@knuckles/ssr/`
