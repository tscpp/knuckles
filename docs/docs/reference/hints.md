# Hints

:::warning
Previously known as "directives," the term "hints" may still be used in the documentation and internally.
:::

## What are hints?

## View Model Hint

The `with` directive allows you to define the data/type of the descendant binding context. Which is a fancy way of saying that the elements below the comment will recieve the provided view model.

<!-- prettier-ignore -->
```html
<!-- ok with: ... -->
  ...
<!-- /ok -->
```

### Importing

You can import a view model (or essentially anything) by specifying the identifier and module. This is **not** the same syntax as ESM.

:::tip Examples

---

Default import:

```html
<!-- ok with: default from './viewmodel.js' -->
```

---

Named import:

```html
<!-- ok with: myViewModel from './viewmodel.js' -->
```

---

Namespace import:

```html
<!-- ok with: * from './viewmodel.js' -->
```

:::

### Types

You can also import only the type by prefixing the identifier with "type".

```html
<!-- ok with: type SomeType from './viewmodel.js' -->
```

[descendants]: /docs/glossary#descendant
