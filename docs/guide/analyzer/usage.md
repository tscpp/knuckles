# Usage

## Syntax

:::warning Subject to change!
The current syntax is experimental and subject to change. It differs from the syntax used by the [server-side renderer](/guide/ssr/intro).
:::

The linter utilizes HTML comments to convey information. These comments are referred to as "directives".

### Directives

:::warning Possible Confusion
The syntax is similar to knockout binding handler comments. Notice the dash between "ko" and the directive. Knockout comments always ha
:::

```html
<!-- ko-directive ... -->
```

- `ko-import` - It's syntax is similar to ES modules. These imports can be utilized in other directives or binding handlers.
- `ko-viewmodel` - Sets the viewmodel for the current view.

## Viewmodels

To import the view model, use the ko-import `directive` like the below example.

```html
<!-- ko-import ViewModel from './viewmodel' -->
```

Then, set the view model for the current file using the ko-viewmodel directive:

```html
<!-- ko-viewmodel ViewModel  -->
```

:::tip
You can pass `typeof ViewModel` to the `ko-viewmodel` directive when using instances (singleton).
:::

## Binding Handlers

Use the `ko-import` directive to import the binding handler type.

```html
<!-- ko-import custom from './binding-handler' -->
```

Then, you can use the binding handler.

```html
<div data-bind="custom: ..."></div>
```

### Declaring Binding Handlers

You can export an existing implementation of `ko.BindingHandler` or declare it in a seperate declaration typescript (`.d.ts`) file like shown below.

```ts
declare class CustomBindingHandler implements ko.BindingHandler<...> { ... }
export default CustomBindingHandler;
```

The generic paramater `T` passed to `ko.BindingHandler` tells the linter what type is expected.

```ts
ko.BindingHandler<string>;
```

### Transforming Child Context

In the rare event the binding handler creates a new child context, the binding should declare the method `transformContext`. No implementation is required.

```ts
declare class CustomBindingHandler implements ko.BindingHandler<...> {
  transformContext!: (input: InputType, context: ParentContextType) => ChildContextType
}
```
