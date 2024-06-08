# Hints

## What are hints?

Hints are similar to [Virtual Elements](/docs/reference/glossary#virtual-element), but provides build-time insights about the view, rather than runtime information. Hints are universal and is used by the tools in the Knuckles toolkit. Hints start with the "ok" [namespace](/docs/reference/glossary#namespace) and end with "/ok", instead of "ko" used by Knockout.

<!-- prettier-ignore -->
```html
<!-- ok ... -->
  ...
<!-- /ok -->
```

## Implementations

- [with](#with) - Importing data or types for [descendants](/docs/reference/glossary#descendant).
- [ssr](#ssr) - Enabling or disabling SSR for [descendants](/docs/reference/glossary#descendant).

## The 'with' hint {#with}

The `with` hint allows you to define the data/type of the descendant binding context. Which is a fancy way of saying that the elements below the comment will recieve the provided view model.

<!-- prettier-ignore -->
```html
<!-- ok with: ... -->
  ...
<!-- /ok -->
```

### Scenarios

- **Type-checking a view:** You need the typings for the view model. You have two options: either import a class that defines both the type and the data, or import only the types using [type-only imports](#type-only-imports).

- **Server-side rendering a view:** You need the actual runtime data of the view model. In this case, import the module that exports the actual data. If the types for the view model are defined in another module, you can wrap the [decendants](/docs/reference/glossary#descendant) in an additional hint with a [type-only import](#type-only-imports).

### Importing

You can import a view model (or essentially anything) by specifying the identifier and module. This is **not** the same syntax as ESM.

:::details Ex: default import

```html
<!-- ok with: default from './viewmodel.js' -->
```

:::

:::details Ex: named import

```html
<!-- ok with: myViewModel from './viewmodel.js' -->
```

:::

:::details Ex: namespace import

```html
<!-- ok with: * from './viewmodel.js' -->
```

:::

### Type-only imports

You can also import only the type by prefixing the identifier with "type".

```html
<!-- ok with: type SomeType from './viewmodel.js' -->
```

[descendants]: /docs/glossary#descendant

## The 'ssr' hint {#ssr}

Used to enable or disable server-side rendering for the [descendant](/docs/reference/glossary#descendant) bindings.

<!-- prettier-ignore -->
```html
<!-- ok ssr: true -->
  ...
<!-- /ok -->
```
