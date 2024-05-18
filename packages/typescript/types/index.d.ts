import type * as ko from "knockout";

type Overwrite<T, U> = Omit<T, keyof U> & U;
type Unwrapped<T> = T extends ko.Observable<infer U> ? U : T;

declare global {
  export namespace Knuckles {
    export interface BindingContext {
      $parentContext: BindingContext | undefined;
      $parents: BindingContext[];
      $parent: BindingContext | undefined;
      $root: unknown;
      $data: unknown;
      $rawData: unknown;
    }

    export type Ambiguous<T> = T | ko.Observable<T>;
    export type AmbiguousRecord<
      K extends string | number | symbol,
      T,
    > = Readonly<Record<K, Ambiguous<T>>>;

    export type Binding<V, E = Comment | Element> = <C extends BindingContext>(
      n: E,
      v: V,
      c: C,
    ) => C;

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
      | HTMLSelectElement
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
        attr: Binding<Ambiguous<AmbiguousRecord<string, string>>>;
        text: Binding<Ambiguous<string>>;
        html: Binding<Ambiguous<string>>;
        style: Binding<Ambiguous<AmbiguousRecord<string, string>>>;
        uniqueName: Binding<Ambiguous<boolean>>;

        if: Binding<Ambiguous<boolean>>;
        ifnot: Binding<Ambiguous<boolean>>;

        css: Binding<
          Ambiguous<string | Ambiguous<AmbiguousRecord<string, boolean>>>
        >;
        class: Binding<Ambiguous<string>>;

        hidden: Binding<Ambiguous<boolean>>;
        visible: Binding<Ambiguous<boolean>>;

        // Knockout will unwrap observables, but not react to them. It is
        // probably not intended to be used with observables.
        valueUpdate: Binding<ValueUpdate, ElementWithValue>;
        valueAllowUnset: Binding<boolean, ElementWithValue>;

        // Knockout supports any element with value, however documentation
        // states that is should be used exclusively with 'input' and
        // 'textarea' elements.
        textInput: Binding<
          Ambiguous<string>,
          HTMLInputElement | HTMLTextAreaElement
        >;

        options: Binding<
          Ambiguous<readonly unknown[]> | ko.ObservableArray<unknown>,
          HTMLSelectElement
        >;
        optionsCaption: Binding<unknown, HTMLSelectElement>;

        // Knockout will unwrap observables, but not react to them. It is
        // probably not intended to be used with observables.
        optionsText: Binding<
          string | ((entry: unknown) => string),
          HTMLSelectElement
        >;
        optionsValue: Binding<
          string | ((entry: unknown) => string),
          HTMLSelectElement
        >;

        selectedOptions: Binding<
          Ambiguous<readonly string[]> | ko.ObservableArray<string>,
          HTMLSelectElement
        >;
      }
    }

    export namespace Loose {
      export interface Bindings extends Knuckles.Bindings {
        attr: Binding<Ambiguous<Readonly<Record<string, any>>>, Element>;
        text: Binding<any>;
        html: Binding<any>;
        style: Binding<Ambiguous<Readonly<Record<string, any>>>>;
        uniqueName: Binding<unknown>;

        if: Binding<unknown>;
        ifnot: Binding<unknown>;

        css: Binding<
          Ambiguous<string | Ambiguous<Readonly<Record<string, any>>>>
        >;
        class: Binding<any>;

        hidden: Binding<any, Element>;
        visible: Binding<any, Element>;

        // See strict definition for details.
        valueUpdate: Binding<Ambiguous<ValueUpdate>, ElementWithValue>;
        valueAllowUnset: Binding<Ambiguous<boolean>, ElementWithValue>;

        // See strict definition for details.
        textInput: Binding<Ambiguous<string>, ElementWithValue>;

        options: Binding<
          Ambiguous<readonly any[]> | ko.ObservableArray<any>,
          HTMLSelectElement
        >;
        optionsCaption: Binding<any, HTMLSelectElement>;

        // See strict definition for details.
        optionsText: Binding<
          Ambiguous<string | ((entry: any) => string)>,
          HTMLSelectElement
        >;
        optionsValue: Binding<
          Ambiguous<string | ((entry: any) => string)>,
          HTMLSelectElement
        >;

        selectedOptions: Binding<
          Ambiguous<readonly string[] | Falsy> | ko.ObservableArray<string>,
          HTMLSelectElement
        >;
      }
    }

    export interface Bindings {
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
        ): C;

        // Index access for undeclared DOM events
        <C extends BindingContext>(
          n: Element,
          v: {
            readonly [key: string]: (this: C["$root"], event: Event) => void;
          },
          c: C,
        ): C;
      };

      click: <C extends BindingContext>(
        n: Element,
        v: Ambiguous<(this: C["$root"], event: MouseEvent) => void>,
        c: C,
      ) => C;
      submit: <C extends BindingContext>(
        n: Element,
        v: Ambiguous<(this: C["$root"], event: SubmitEvent) => void>,
        c: C,
      ) => C;

      enable: Binding<Ambiguous<boolean>, ElementWithDisabled>;
      disable: Binding<Ambiguous<boolean>, ElementWithDisabled>;

      value: Binding<Ambiguous<string>, ElementWithValue>;

      hasFocus: Binding<Ambiguous<boolean>, Element>;

      checked: Binding<
        Ambiguous<boolean | readonly string[]> | ko.ObservableArray<string>,
        HTMLInputElement
      >;
      checkedValue: Binding<Ambiguous<string>, HTMLInputElement>;

      foreach: <
        const K extends string,
        T extends readonly unknown[] | ko.Observable<readonly unknown[]>,
        C extends BindingContext,
      >(
        n: Comment | Element,
        v: { data: T; as: K } | T,
        c: C,
      ) => Overwrite<
        C,
        {
          $parentContext: C;
          $parents: [C["$data"], ...C["$parents"]];
          $parent: C["$data"];
          $root: C["$root"];
          $data: ko.Unwrapped<T>;
          $rawData: T;
        } & {
          $index: ko.Observable<number>;
        } & (K extends string ? Record<K, T> : {})
      >;

      using: Bindings["with"];
      with: <T extends object, C extends BindingContext>(
        n: Comment | Element,
        v: T | ko.Observable<T>,
        c: C,
      ) => Overwrite<
        C,
        {
          $parentContext: C;
          $parents: [C["$data"], ...C["$parents"]];
          $parent: C["$data"];
          $root: C["$root"];
          $data: ko.Unwrapped<T>;
          $rawData: T;
        }
      >;
      let: <T extends object, C extends BindingContext>(
        n: Comment | Element,
        v: T | ko.Observable<T>,
        c: C,
      ) => Overwrite<C, T>;

      // TODO: Untyped
      template: Binding<any>;
      component: Binding<any>;
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
    [name: string]: Knuckles.Binding<unknown>;
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
    ) => Overwrite<
      C,
      {
        $parentContext: C;
        $parents: [C["$data"], ...C["$parents"]];
        $parent: C["$data"];
        $root: Knuckles.Interop<T>;
        $data: Unwrapped<Knuckles.Interop<T>>;
        $rawData: Knuckles.Interop<T>;
      }
    >;
  }

  // export { Knuckles };
}

export default ns;
