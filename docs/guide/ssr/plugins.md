# Plugins

:::warning Work in progress
Documentation is unfinished.
:::

## Writing plugins

For example, you can integrate your i18n framework by creating a plugin similar to the below.

```ts
import { Plugin, utils } from "@knuckles/ssr";

const i18n: Plugin = {
  // Look for bindings with name "i18n". Once the plugin claims the bindings,
  // no other plugins will touch it.
  filter: (binding) => binding.name === "i18n",

  // This method is called when server-side rendering.
  ssr: ({ binding, generated, value }) => {
    // `value()` is the evaluation of the binding expression.
    const translated = i18next.t(value());

    // Get the inner range (children) of the element of the binding.
    const inner = utils.getInnerRange(binding.parent, generated.original);
    // Replace the inner range with the translated text.
    generated.update(...inner.offset, utils.escapeHtml(translated));
  },
};

export default i18n;
```
