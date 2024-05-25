# Glossary

### Binding Handler

Binding handlers are implementations for the bindings applied to elements and [virtual elements](#virtual-element). See [creating custom bindings](https://knockoutjs.com/documentation/custom-bindings.html) at Knockout's documentation.

### Descendant

In the context of tree structures, descendants refer to all the nodes below a particular node in the hierarchy. This includes the children, grandchildren, great-grandchildren, and so on. Put simply, descendants are all the nodes that can be reached by following paths down from a specific node in the tree.

```
parent
├── child            <- Descendant to parent
│   └── grandchild   <- Descendant to parent
└── child            <- Descendant to parent
```

### Hint

Similar to [virtual elements](#virtual-element), hints provide insights to the tools in the Knuckles toolkit. Hints have the "ok" [namespace](#namespace), instead of the "ko" used by Knockout. Read more about [hints](/docs/reference/hints).

<!-- prettier-ignore -->
```html
<!-- ok ... -->
  ...
<!-- /ok -->
```

### Namespace

> A namespace is an abstract container or environment created to hold a logical grouping of unique identifiers (i.e., names).
>
> — [_Wikipedia_](https://en.wikipedia.org/w/index.php?title=Namespace_%28computer_science%29&oldid=499156408)

### Server-side Rendering (SSR) {#ssr}

Also an abbriviation of Server-side Renderer (the tool). Server-side rendering is the concept of rendering views on the server before handing it to the client. It is dependent on the context since it renders data into the view.

### Virtual Element

Virtual elements have comments surrounding the [descendants](#descendant). In Knockout, this is used to control the decendants in some way using [binding handlers](#binding-handler). Virtual elements always start with the [namespace](#namespace) "ko" and end with "/ko".

<!-- prettier-ignore -->
```html
<!-- ko ... -->
  ...
<!-- /ko -->
```
