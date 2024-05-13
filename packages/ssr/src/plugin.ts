import { type BindingContext } from "./binding-context.js";
import type { Binding } from "@knuckles/syntax-tree";
import type MagicString from "magic-string";

export interface Sibling {
  /**
   * This is the parsed binding node, which contains the contents and ranges of
   * the binding in the original document. Use {@link Binding.parent} to get
   * the containing element.
   *
   * @example <caption>Using the binding's original range to modify the generated document.</caption>
   * ```js
   * ssr({ binding, generated }) {
   *   generated.overwrite(...binding.range.offset, "...");
   * }
   * ```
   */
  binding: Binding;

  /**
   * The binding context contains the values available when evaluating the
   * binding. This should only be modified in the {@link Plugin.alter} hook,
   * and can be extended for decendants using the {@link Plugin.extend} hook.
   *
   * @see https://knockoutjs.com/documentation/binding-context.html
   */
  context: BindingContext;

  /**
   * The unwrapped value evaluated from the binding expression. This is the
   * same as the rawValue, unless the rawValue is wrapped in any subscribable,
   * in which case it is the current value of the observable.
   *
   * ```js
   * value === ko.unwrap(rawValue)
   * ```
   */
  value(): unknown;

  /**
   * The "raw" value evaluated from the binding expression. This may be a
   * wrapped in any subscribable. Use this when passing the data to a child
   * binding context.
   *
   * ```js
   * ko.unwrap(rawValue) === value
   * ```
   */
  rawValue(): unknown;
}

export interface Self extends Sibling {
  /**
   * An array of bindings on the same parent element. It's populated only if
   * the parent element has multiple bindings.
   *
   * @example <caption>Retrieving the "as" binding value to extend the child binding context.</caption>
   * ```
   * extend({ parent }) {
   *   const as = parent.siblings.find((sibling) => sibling.binding.name.value === "as");
   *   as.value; // "item"
   * }
   * ```
   */
  siblings: readonly Sibling[];
}

export interface Plugin {
  /**
   * Filter bindings to be handled by the plugin. Once the filter passes, only
   * that plugin will touch the binding. In other words, only one plugin can
   * handle one binding.
   */
  filter: (binding: Binding) => boolean;

  /**
   * The ssr hook allows for plugin to render the binding server-side. The hook
   * is called during the capture phase, which renders the parent node first,
   * then all decendants.
   *
   * @example <caption>Rendering the "text" binding simlified.</caption>
   * ```
   * ssr({ binding, generated, value }) {
   *   const inner = utils.extractIntoTemplate(binding, generated);
   *   generated.overwrite(...inner.offset, String(value));
   * }
   * ```
   */
  ssr?:
    | ((
        args: Self & {
          /**
           * The generated document. This is modified using a magic string,
           * which allows for modifications to be mode to the new document
           * using the original parsed nodes' location.
           *
           * @see https://github.com/Rich-Harris/magic-string
           */
          generated: MagicString;

          /**
           * Register a callback to be called during the bubble phase. This
           * allows the ssr hook wait for decendants to be rendered.
           */
          bubble: (callback: () => void | PromiseLike<void>) => void;

          /**
           * Whether the decendants should be rendered.
           */
          propagate: boolean | "custom";

          /**
           * Allows for rendering of decendants.
           */
          renderFragment: (childContext: BindingContext) => Promise<string>;
        },
      ) => void | PromiseLike<void>)
    | undefined;

  /**
   * The alter hook allows for plugins to modify the binding context used for
   * the current binding.
   */
  alter?: (args: {
    binding: Binding;
    context: BindingContext;
  }) => void | PromiseLike<void>;

  /**
   * The extend hook allows for plugins to define a custom function to create
   * child binding contexts.
   */
  extend?:
    | ((args: { parent: Self }) => BindingContext | PromiseLike<BindingContext>)
    | undefined;

  /**
   * The propagate hook allows for plugins to controle whether the decendants
   * should be rendered.
   */
  propagate?: ((args: Self) => boolean | "custom") | boolean | "custom";
}
