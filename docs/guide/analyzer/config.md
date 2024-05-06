# Configuration

## Files to include

When you pass a directory to the linter, it scans all `.html` files by default. Customize this behavior by setting the `include` and `exclude` fields using glob patterns."

:::info NOTE
When supplying the path to a single file to the linter, it will always be included, disregarding this configuration.
:::

```js
export default {
  // Only pick files that ends with ".view.html"
  include: ["**/*.view.html"], // [!code ++]
  // Exclude has higher priority, all files under the "dist/" directory is ignored.
  exclude: ["dist/**"], // [!code ++]
};
```

## Severity

You can configure the severity for every diagnostic, including TypeScript errors. The severity field is a map with the diagnostic code or name, and the severity `"off"`, `"warn"`, or `"error"`.

:::tip
If you have [the vscode extention](/packages/readme/vscode) installed, the diagnostic code is shown when hovering the error in the editor.
:::

```js
export default {
  severity: {
    // The diagnostic is by default reported as an error.
    "no-viewmodel-reference": "warn", // [!code ++]
  },
};
```

## tsconfig

The linter will automatically resolve the tsconfig from the working directory (cwd) if the field is not provided.

```js
export default {
  tsconfig: "./path/to/tsconfig.json", // [!code ++]
};
```
