# Usage

### CLI

The library comes with a command-line interface which can be used to render individual documents. The cli does not yet support rendering multiple documents in one go.

```sh
npx kossr --input view.html --outdir build
```

Run `kossr --help` to see all available flags.

### API

The API is written in node.js-flavoured javascript. The main module exports the function `render` which takes an input document and renders bindings into it.

```js
import { render } from '@knuckles/ssr';

const document = `
  <!-- ko ssr: ./viewmodel.js -->
    <p data-bind="text: message"></p>
  <!-- /ko -->
`;

const generated = await render(document, {
  plugins: [...],
  filename: '...',
});

generated.document
// <p data-bind="text: message">Hello world!</p>
```
