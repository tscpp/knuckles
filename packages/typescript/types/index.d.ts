import type * as ko from "knockout";

type Overwrite<T, U> = Omit<T, keyof U> & U;
type Unwrapped<T> = T extends ko.Observable<infer U> ? U : T;

declare global {
  export namespace Knuckles {
    export interface Ctx {
      $parentContext: Ctx | undefined;
      $parents: Ctx[];
      $parent: Ctx | undefined;
      $root: unknown;
      $data: unknown;
      $rawData: unknown;
    }

    export type Obs<T> = T | ko.Observable<T>;

    export type Pre<V, E = Comment | Element> = <C extends Ctx>(
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
        attr: Pre<Obs<Readonly<Record<string, Obs<string>>>>>;
        text: Pre<Obs<string>>;
        html: Pre<Obs<string>>;
        style: Pre<Obs<Readonly<Record<string, Obs<string>>>>>;
        uniqueName: Pre<Obs<boolean>>;

        if: Pre<Obs<boolean>>;
        ifnot: Pre<Obs<boolean>>;

        css: Pre<Obs<string | Obs<Readonly<Record<string, Obs<boolean>>>>>>;
        class: Pre<Obs<string>>;

        hidden: Pre<Obs<boolean>>;
        visible: Pre<Obs<boolean>>;

        // Knockout will unwrap observables, but not react to them. It is
        // probably not intended to be used with observables.
        valueUpdate: Pre<ValueUpdate, ElementWithValue>;
        valueAllowUnset: Pre<boolean, ElementWithValue>;

        // Knockout supports any element with value, however documentation
        // states that is should be used exclusively with 'input' and
        // 'textarea' elements.
        textInput: Pre<Obs<string>, HTMLInputElement | HTMLTextAreaElement>;

        options: Pre<
          Obs<readonly unknown[]> | ko.ObservableArray<unknown>,
          HTMLSelectElement
        >;
        optionsCaption: Pre<unknown, HTMLSelectElement>;

        // Knockout will unwrap observables, but not react to them. It is
        // probably not intended to be used with observables.
        optionsText: Pre<
          string | ((entry: unknown) => string),
          HTMLSelectElement
        >;
        optionsValue: Pre<
          string | ((entry: unknown) => string),
          HTMLSelectElement
        >;

        selectedOptions: Pre<
          Obs<readonly string[]> | ko.ObservableArray<string>,
          HTMLSelectElement
        >;
      }
    }

    export namespace Loose {
      export interface Bindings extends Knuckles.Bindings {
        attr: Pre<Obs<Readonly<Record<string, any>>>, Element>;
        text: Pre<any>;
        html: Pre<any>;
        style: Pre<Obs<Readonly<Record<string, any>>>>;
        uniqueName: Pre<unknown>;

        if: Pre<unknown>;
        ifnot: Pre<unknown>;

        css: Pre<Obs<string | Obs<Readonly<Record<string, any>>>>>;
        class: Pre<any>;

        hidden: Pre<any, Element>;
        visible: Pre<any, Element>;

        // See strict definition for details.
        valueUpdate: Pre<Obs<ValueUpdate>, ElementWithValue>;
        valueAllowUnset: Pre<Obs<boolean>, ElementWithValue>;

        // See strict definition for details.
        textInput: Pre<Obs<string>, ElementWithValue>;

        options: Pre<
          Obs<readonly any[]> | ko.ObservableArray<any>,
          HTMLSelectElement
        >;
        optionsCaption: Pre<any, HTMLSelectElement>;

        // See strict definition for details.
        optionsText: Pre<
          Obs<string | ((entry: any) => string)>,
          HTMLSelectElement
        >;
        optionsValue: Pre<
          Obs<string | ((entry: any) => string)>,
          HTMLSelectElement
        >;

        selectedOptions: Pre<
          Obs<readonly string[] | Falsy> | ko.ObservableArray<string>,
          HTMLSelectElement
        >;
      }
    }

    export interface Bindings {
      event: {
        // Declared DOM events
        <C extends Ctx>(
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
        <C extends Ctx>(
          n: Element,
          v: {
            readonly [key: string]: (this: C["$root"], event: Event) => void;
          },
          c: C,
        ): C;
      };

      click: <C extends Ctx>(
        n: Element,
        v: Obs<(this: C["$root"], event: MouseEvent) => void>,
        c: C,
      ) => C;
      submit: <C extends Ctx>(
        n: Element,
        v: Obs<(this: C["$root"], event: SubmitEvent) => void>,
        c: C,
      ) => C;

      enable: Pre<Obs<boolean>, ElementWithDisabled>;
      disable: Pre<Obs<boolean>, ElementWithDisabled>;

      value: Pre<Obs<string>, ElementWithValue>;

      hasFocus: Pre<Obs<boolean>, Element>;

      checked: Pre<
        Obs<boolean | readonly string[]> | ko.ObservableArray<string>,
        HTMLInputElement
      >;
      checkedValue: Pre<Obs<string>, HTMLInputElement>;

      foreach: <
        const K extends string,
        T extends readonly unknown[] | ko.Observable<readonly unknown[]>,
        C extends Ctx,
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
      with: <T extends object, C extends Ctx>(
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
      let: <T extends object, C extends Ctx>(
        n: Comment | Element,
        v: T | ko.Observable<T>,
        c: C,
      ) => Overwrite<C, T>;

      // TODO: Untyped
      template: Pre<any>;
      component: Pre<any>;
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
    [name: string]: Knuckles.Pre<unknown>;
  };
  export const element: <K extends keyof ElementTagNameMap>(
    tagName: K,
  ) => ElementTagNameMap[K];
  export const comment: () => Comment;
  export const type: <T>() => T;
  export const hints: Hints;

  interface Hints {
    with: <T, C extends Knuckles.Ctx>(
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
