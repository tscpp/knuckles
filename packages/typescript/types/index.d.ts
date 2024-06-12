import type * as ko from "knockout";

declare global {
  export namespace Knuckles {
    export interface BindingContext {
      $parentContext: BindingContext | undefined;
      $parents: any[];
      $parent: any;
      $root: any;
      $data: any;
      $rawData: any;
    }

    export type MaybeSubscribable<T> = T | ko.Subscribable<T>;
    export type MaybeSubscribableRecord<
      K extends string | number | symbol,
      T,
    > = Readonly<Record<K, MaybeSubscribable<T>>>;

    export type Unwrapped<T> = T extends ko.Subscribable<infer U> ? U : T;

    export namespace Traits {
      export type RequiresContextParamater = (n: any, v: any, c: any) => void;
      export type ReturnsChildContext = (
        n: any,
        v: any,
        c: any,
      ) => BindingContext;
    }

    export type PreserveBinding<V, E = Comment | Element> = (
      n: E,
      v: V,
    ) => void;

    type ValueUpdate = "input" | "keyup" | "keypress" | "afterkeydown";

    type ElementWithValue =
      | HTMLButtonElement
      | HTMLDataElement
      | HTMLInputElement
      | HTMLLinkElement
      | HTMLMeterElement
      | HTMLOptionElement
      | HTMLOutputElement
      | HTMLParamElement
      | HTMLProgressElement
      | HTMLTextAreaElement;

    type ElementWithDisabled =
      | HTMLButtonElement
      | HTMLFieldSetElement
      | HTMLInputElement
      | HTMLLinkElement
      | HTMLOptGroupElement
      | HTMLOptionElement
      | HTMLSelectElement
      | HTMLStyleElement
      | HTMLTextAreaElement
      | SVGStyleElement;

    type Falsy = false | null | undefined;

    export namespace Strict {
      export interface Bindings extends Knuckles.Bindings {
        /**
         * Binds the provided record to the element's attributes.
         *
         * @see https://knockoutjs.com/documentation/attr-binding.html
         */
        attr: PreserveBinding<
          MaybeSubscribable<MaybeSubscribableRecord<string, string>>,
          Element
        >;
        /**
         * Replaces the node's content with the provided text.
         *
         * @see https://knockoutjs.com/documentation/text-binding.html
         */
        text: PreserveBinding<MaybeSubscribable<string>>;
        /**
         * Replaces the node's content with the provided html.
         *
         * @see https://knockoutjs.com/documentation/html-binding.html
         */
        html: PreserveBinding<MaybeSubscribable<string>>;
        /**
         * Binds the provided record to the element's "style" attribute.
         *
         * @see https://knockoutjs.com/documentation/style-binding.html
         */
        style: PreserveBinding<
          MaybeSubscribable<MaybeSubscribableRecord<string, string>>,
          Element
        >;
        /**
         * Binds a unique value to the "name" attribute.
         *
         * @see https://knockoutjs.com/documentation/uniqueName-binding.html
         */
        uniqueName: PreserveBinding<MaybeSubscribable<boolean>, Element>;

        /**
         * Controls whether the descendants is present, based on a specified
         * condition.
         *
         * @see {@link ifnot}
         * @see https://knockoutjs.com/documentation/if-binding.html
         */
        if: PreserveBinding<MaybeSubscribable<boolean>>;
        /**
         * Controls whether the descendants is not present, based on a
         * specified condition.
         *
         * @see {@link if}
         * @see https://knockoutjs.com/documentation/if-binding.html
         */
        ifnot: PreserveBinding<MaybeSubscribable<boolean>>;

        /**
         * Dynamically applies or removes the provided classes to an element.
         *
         * @see https://knockoutjs.com/documentation/css-binding.html
         */
        css: PreserveBinding<
          MaybeSubscribable<
            string | MaybeSubscribable<MaybeSubscribableRecord<string, boolean>>
          >,
          Element
        >;
        /**
         * Appends the provided class to the element.
         *
         * @see https://knockoutjs.com/documentation/css-binding.html
         */
        class: PreserveBinding<MaybeSubscribable<string>, Element>;

        /**
         * Controls weather the element is visible or not, based on the
         * provided condition.
         *
         * @see {@link visible}
         * @see https://knockoutjs.com/documentation/visible-binding.html
         */
        hidden: PreserveBinding<MaybeSubscribable<boolean>, Element>;
        /**
         * Controls weather the element is visible or not, based on the
         * provided condition.
         *
         * @see {@link hidden}
         * @see https://knockoutjs.com/documentation/visible-binding.html
         */
        visible: PreserveBinding<MaybeSubscribable<boolean>, Element>;

        // Knockout will unwrap observables, but not react to them. It is
        // probably not intended to be used with observables.
        /**
         * @see {@link value}
         * @see https://knockoutjs.com/documentation/value-binding.html
         */
        valueUpdate: PreserveBinding<ValueUpdate, ElementWithValue>;
        /**
         * @see {@link value}
         * @see https://knockoutjs.com/documentation/value-binding.html
         */
        valueAllowUnset: PreserveBinding<boolean, ElementWithValue>;

        // Knockout supports any element with value, however documentation
        // states that is should be used exclusively with 'input' and
        // 'textarea' elements.
        /**
         * Synchronizes a `<input>` or `<textarea>` with a view model property
         * bidirectionally, with immediate updates between the provided
         * observable and the element’s value. Unlike the {@link value}
         * binding, `textInput` ensures instantaneous updates from the DOM for
         * various user inputs like autocomplete, drag-and-drop, and clipboard
         * events.
         *
         * @see https://knockoutjs.com/documentation/textinput-binding.html
         */
        textInput: PreserveBinding<
          MaybeSubscribable<string>,
          HTMLInputElement | HTMLTextAreaElement
        >;

        /**
         * The options binding manages the selection choices for a `<select>`
         * element or multi-select list (e.g., `<select size='6'>`).
         *
         * @see {@link optionsCaption}
         * @see {@link optionsText}
         * @see {@link optionsValue}
         * @see {@link selectedOptions}
         * @see https://knockoutjs.com/documentation/options-binding.html
         */
        options: PreserveBinding<
          MaybeSubscribable<readonly unknown[]> | ko.ObservableArray<unknown>,
          HTMLSelectElement
        >;
        /**
         * @see {@link options}
         * @see https://knockoutjs.com/documentation/options-binding.html
         */
        optionsCaption: PreserveBinding<unknown, HTMLSelectElement>;

        // Knockout will unwrap observables, but not react to them. It is
        // probably not intended to be used with observables.
        /**
         * @see {@link options}
         * @see https://knockoutjs.com/documentation/options-binding.html
         */
        optionsText: PreserveBinding<
          string | ((entry: unknown) => string),
          HTMLSelectElement
        >;
        /**
         * @see {@link options}
         * @see https://knockoutjs.com/documentation/options-binding.html
         */
        optionsValue: PreserveBinding<
          string | ((entry: unknown) => string),
          HTMLSelectElement
        >;

        /**
         * @see {@link options}
         * @see https://knockoutjs.com/documentation/options-binding.html
         */
        selectedOptions: PreserveBinding<
          MaybeSubscribable<readonly string[]> | ko.ObservableArray<string>,
          HTMLSelectElement
        >;
      }
    }

    export namespace Loose {
      export interface Bindings extends Knuckles.Bindings {
        /**
         * Binds the provided record to the element's attributes.
         *
         * @see https://knockoutjs.com/documentation/attr-binding.html
         */
        attr: PreserveBinding<
          MaybeSubscribable<Readonly<Record<string, any>>>,
          Element
        >;
        /**
         * Replaces the node's content with the provided text.
         *
         * @see https://knockoutjs.com/documentation/text-binding.html
         */
        text: PreserveBinding<any>;
        /**
         * Replaces the node's content with the provided html.
         *
         * @see https://knockoutjs.com/documentation/html-binding.html
         */
        html: PreserveBinding<any>;
        /**
         * Binds the provided record to the element's "style" attribute.
         *
         * @see https://knockoutjs.com/documentation/style-binding.html
         */
        style: PreserveBinding<
          MaybeSubscribable<Readonly<Record<string, any>>>,
          Element
        >;
        /**
         * Binds a unique value to the "name" attribute.
         *
         * @see https://knockoutjs.com/documentation/uniqueName-binding.html
         */
        uniqueName: PreserveBinding<unknown, Element>;

        /**
         * Controls whether the descendants is present, based on a specified
         * condition.
         *
         * @see {@link ifnot}
         * @see https://knockoutjs.com/documentation/if-binding.html
         */
        if: PreserveBinding<unknown>;
        /**
         * Controls whether the descendants is not present, based on a
         * specified condition.
         *
         * @see {@link if}
         * @see https://knockoutjs.com/documentation/if-binding.html
         */
        ifnot: PreserveBinding<unknown>;

        /**
         * Dynamically applies or removes the provided classes to an element.
         *
         * @see https://knockoutjs.com/documentation/css-binding.html
         */
        css: PreserveBinding<
          MaybeSubscribable<
            string | MaybeSubscribable<Readonly<Record<string, any>>>
          >,
          Element
        >;
        /**
         * Appends the provided class to the element.
         *
         * @see https://knockoutjs.com/documentation/css-binding.html
         */
        class: PreserveBinding<any, Element>;

        /**
         * Controls weather the element is visible or not, based on the
         * provided condition.
         *
         * @see {@link visible}
         * @see https://knockoutjs.com/documentation/visible-binding.html
         */
        hidden: PreserveBinding<any, Element>;
        /**
         * Controls weather the element is visible or not, based on the
         * provided condition.
         *
         * @see {@link hidden}
         * @see https://knockoutjs.com/documentation/visible-binding.html
         */
        visible: PreserveBinding<any, Element>;

        // See strict definition for details.
        /**
         * @see {@link value}
         * @see https://knockoutjs.com/documentation/value-binding.html
         */
        valueUpdate: PreserveBinding<
          MaybeSubscribable<ValueUpdate>,
          ElementWithValue
        >;
        /**
         * @see {@link value}
         * @see https://knockoutjs.com/documentation/value-binding.html
         */
        valueAllowUnset: PreserveBinding<
          MaybeSubscribable<boolean>,
          ElementWithValue
        >;

        // See strict definition for details.
        /**
         * Synchronizes a `<input>` or `<textarea>` with a view model property
         * bidirectionally, with immediate updates between the provided
         * observable and the element’s value. Unlike the {@link value}
         * binding, `textInput` ensures instantaneous updates from the DOM for
         * various user inputs like autocomplete, drag-and-drop, and clipboard
         * events.
         *
         * @see https://knockoutjs.com/documentation/textinput-binding.html
         */
        textInput: PreserveBinding<MaybeSubscribable<string>, ElementWithValue>;

        /**
         * The options binding manages the selection choices for a `<select>`
         * element or multi-select list (e.g., `<select size='6'>`).
         *
         * @see {@link optionsCaption}
         * @see {@link optionsText}
         * @see {@link optionsValue}
         * @see {@link selectedOptions}
         * @see https://knockoutjs.com/documentation/options-binding.html
         */
        options: PreserveBinding<
          MaybeSubscribable<readonly any[]> | ko.ObservableArray<any>,
          HTMLSelectElement
        >;
        /**
         * @see {@link options}
         * @see https://knockoutjs.com/documentation/options-binding.html
         */
        optionsCaption: PreserveBinding<any, HTMLSelectElement>;

        // See strict definition for details.
        /**
         * @see {@link options}
         * @see https://knockoutjs.com/documentation/options-binding.html
         */
        optionsText: PreserveBinding<
          MaybeSubscribable<string | ((entry: any) => string)>,
          HTMLSelectElement
        >;
        /**
         * @see {@link options}
         * @see https://knockoutjs.com/documentation/options-binding.html
         */
        optionsValue: PreserveBinding<
          MaybeSubscribable<string | ((entry: any) => string)>,
          HTMLSelectElement
        >;

        /**
         * @see {@link options}
         * @see https://knockoutjs.com/documentation/options-binding.html
         */
        selectedOptions: PreserveBinding<
          | MaybeSubscribable<readonly string[] | Falsy>
          | ko.ObservableArray<string>,
          HTMLSelectElement
        >;
      }
    }

    export interface Bindings {
      /**
       * Adds event listeners for each entry in the provided record on the
       * element.
       *
       * @see {@link click}
       * @see {@link submit}
       * @see https://knockoutjs.com/documentation/event-binding.html
       */
      event: {
        // Declared DOM events
        <C extends BindingContext>(
          n: Element,
          v: {
            readonly [K in keyof WindowEventMap]: (
              this: C["$root"],
              event: WindowEventMap[K],
            ) => void;
          },
          c: C,
        ): void;

        // Index access for undeclared DOM events
        <C extends BindingContext>(
          n: Element,
          v: {
            readonly [key: string]: (
              this: C["$data"],
              data: C["$data"],
              event: Event,
            ) => void;
          },
          c: C,
        ): void;
      };

      /**
       * Adds the "click" event listener to the element.
       *
       * @see https://knockoutjs.com/documentation/click-binding.html
       */
      click: <C extends BindingContext>(
        n: Element,
        v: MaybeSubscribable<
          (this: C["$data"], data: C["$data"], event: MouseEvent) => void
        >,
        c: C,
      ) => void;
      /**
       * Adds the "submit" event listener to the element.
       *
       * @see https://knockoutjs.com/documentation/submit-binding.html
       */
      submit: <C extends BindingContext>(
        n: Element,
        v: MaybeSubscribable<
          (this: C["$data"], data: C["$data"], event: SubmitEvent) => void
        >,
        c: C,
      ) => void;

      /**
       * Adds the boolean `disabled` attributes based on the specified
       * condition.
       *
       * @see https://knockoutjs.com/documentation/enable-binding.html
       */
      enable: PreserveBinding<MaybeSubscribable<boolean>, ElementWithDisabled>;

      /**
       * Adds the boolean `disabled` attributes based on the specified
       * condition.
       *
       * @see https://knockoutjs.com/documentation/enable-binding.html
       */
      disable: PreserveBinding<MaybeSubscribable<boolean>, ElementWithDisabled>;

      /**
       * @see https://knockoutjs.com/documentation/value-binding.html
       */
      value: PreserveBinding<MaybeSubscribable<string>, ElementWithValue> &
        PreserveBinding<MaybeSubscribable<unknown>, HTMLSelectElement>;

      /**
       * @see https://knockoutjs.com/documentation/hasfocus-binding.html
       */
      hasFocus: PreserveBinding<MaybeSubscribable<boolean>, Element>;

      /**
       * @see {@link checkedValue}
       * @see https://knockoutjs.com/documentation/checked-binding.html
       */
      checked: PreserveBinding<
        | MaybeSubscribable<boolean | readonly string[]>
        | ko.ObservableArray<string>,
        HTMLInputElement
      >;
      /**
       * @see https://knockoutjs.com/documentation/checked-binding.html
       */
      checkedValue: PreserveBinding<
        MaybeSubscribable<string>,
        HTMLInputElement
      >;

      /**
       * @see https://knockoutjs.com/documentation/foreach-binding.html
       */
      foreach: <
        const K extends string,
        T extends MaybeSubscribable<unknown[] | readonly unknown[]>,
        C extends BindingContext,
      >(
        n: Comment | Element,
        v: { data: T; as: K } | T,
        c: C,
      ) => {
        $parentContext: C | undefined;
        $parents: [C["$data"], ...C["$parents"]];
        $parent: C["$data"];
        $root: C["$root"];
        $data: Unwrapped<Unwrapped<T>[number]>;
        $rawData: Unwrapped<T>[number];
        $index: ko.Observable<number>;
      };

      /**
       * @see https://knockoutjs.com/documentation/with-binding.html
       */
      using: Bindings["with"];
      /**
       * @see https://knockoutjs.com/documentation/with-binding.html
       */
      with: <T extends object, C extends BindingContext>(
        n: Comment | Element,
        v: T | ko.Observable<T>,
        c: C,
      ) => {
        $parentContext: C;
        $parents: [C["$data"], ...C["$parents"]];
        $parent: C["$data"];
        $root: C["$root"];
        $data: Unwrapped<T>;
        $rawData: T;
      };
      /**
       * @see https://knockoutjs.com/documentation/let-binding.html
       */
      let: <T extends object, C extends BindingContext>(
        n: Comment | Element,
        v: T | ko.Observable<T>,
        c: C,
      ) => {
        $parentContext: C;
        $parents: [C["$data"], ...C["$parents"]];
        $parent: C["$data"];
        $root: C["$root"];
        $data: Unwrapped<T>;
        $rawData: T;
      } & T;

      // TODO: Untyped
      /**
       * @see https://knockoutjs.com/documentation/template-binding.html
       */
      template: PreserveBinding<any>;
      /**
       * @see https://knockoutjs.com/documentation/component-binding.html
       */
      component: PreserveBinding<any>;
    }

    export interface Settings {}

    type Instanciate<T> = T extends new () => infer U
      ? U
      : T extends () => infer U
        ? U
        : T;
    type DefaultInterop<T> = Instanciate<
      T extends { default: infer U } ? U : T
    >;

    // @ts-ignore
    type _CustomInterop<T> = Knuckles.CustomInterop<T>;

    export type Interop<T> = Settings extends { interop: "custom" }
      ? _CustomInterop<T>
      : DefaultInterop<T>;
  }
}

declare namespace ns {
  export const strict: Knuckles.Strict.Bindings;
  export const loose: Knuckles.Loose.Bindings & {
    [name: string]: Knuckles.PreserveBinding<unknown>;
  };
  export const element: <K extends keyof ElementTagNameMap>(
    tagName: K,
  ) => ElementTagNameMap[K];
  export const comment: () => Comment;
  export const type: <T>() => T;
  export const hints: Hints;

  interface Hints {
    with: <T, C extends Knuckles.BindingContext>(
      v: T,
      c: C,
    ) => {
      $parentContext: C;
      $parents: [C["$data"], ...C["$parents"]];
      $parent: C["$data"];
      $root: Knuckles.Interop<T>;
      $data: Knuckles.Unwrapped<Knuckles.Interop<T>>;
      $rawData: Knuckles.Interop<T>;
    };
  }
}

export default ns;
