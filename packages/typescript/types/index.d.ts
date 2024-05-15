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

    export namespace Strict {
      export interface Bindings extends Knuckles.Bindings {
        text: Pre<string | null | undefined>;
      }
    }

    export namespace Loose {
      export interface Bindings extends Knuckles.Bindings {
        text: Pre<string | number | null | undefined>;
      }
    }

    export interface Bindings {
      visible: Pre<Obs<boolean>>;
      hidden: Pre<Obs<boolean>>;
      html: Pre<Obs<string>>;
      class: Pre<Obs<string>>;
      css: Pre<string | Record<string, boolean | ko.Observable<boolean>>>;
      style: Pre<Record<string, string | ko.Observable<string>>>;
      // TODO: Create types for the standard attributes
      attr: Pre<Record<string, unknown>>;
      event: Pre<{
        [key in keyof WindowEventMap]?: (
          data: any,
          event: WindowEventMap[key],
        ) => any;
      }>;
      click: Pre<(data: any, event: MouseEvent) => void>;
      submit: Pre<(form: HTMLFormElement) => void>;
      enable: Pre<boolean>;
      disable: Pre<boolean>;
      value: Pre<any>;

      // Use this definition if the function can be guaranteed to return const string.
      // TODO: Revisit
      // valueUpdate: BindingContextIdentityTransform<'input' | 'keyup' | 'keypress' | 'afterkeydown'>
      valueUpdate: Pre<string>;

      valueAllowUnset: Pre<boolean>;
      textInput: Pre<string>;
      hasFocus: Pre<any>;
      checked: Pre<any>;
      checkedValue: Pre<any>;
      options: Pre<any>;
      optionsText: Pre<string>;
      optionsCaption: Pre<string>;
      optionsValue: Pre<string>;
      selectedOptions: Pre<any>;
      uniqueName: Pre<boolean>;
      template: Pre<any>;
      component: Pre<string | { name: any; params: any }>;
      if: Pre<unknown>;
      ifnot: Pre<unknown>;

      foreach: <
        const K extends string,
        T extends readonly unknown[] | ko.Observable<readonly unknown[]>,
        C extends Ctx,
      >(
        n: Comment | Element,
        v: { data: T; as: K } | T,
        c: C,
      ) => Overwrite<C, {
        $parentContext: C;
        $parents: [C["$data"], ...C["$parents"]];
        $parent: C["$data"];
        $root: C["$root"];
        $data: ko.Unwrapped<T>;
        $rawData: T;
      } & {
        $index: ko.Observable<number>;
      } & (K extends string ? Record<K, T> : {})>;

      using: Bindings["with"];
      with: <T extends object, C extends Ctx>(
        n: Comment | Element,
        v: T | ko.Observable<T>,
        c: C,
      ) => Overwrite<C,{
        $parentContext: C;
        $parents: [C["$data"], ...C["$parents"]];
        $parent: C["$data"];
        $root: C["$root"];
        $data: ko.Unwrapped<T>;
        $rawData: T;
      }>;
      let: <T extends object, C extends Ctx>(
        n: Comment | Element,
        v: T | ko.Observable<T>,
        c: C,
      ) => Overwrite<C, T>;
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
  export const loose: Knuckles.Loose.Bindings;
  export const element: <K extends keyof ElementTagNameMap>(tagName: K) => ElementTagNameMap[K];
  export const comment: () => Comment;
  export const type: <T>() => T;
  export const hints: Hints;

  interface Hints {
    with: <T, C extends Knuckles.Ctx>(v: T, c: C) => Overwrite<C, {
      $parentContext: C;
      $parents: [C["$data"], ...C["$parents"]];
      $parent: C["$data"];
      $root: Knuckles.Interop<T>;
      $data: Unwrapped<Knuckles.Interop<T>>;
      $rawData: Knuckles.Interop<T>;
    }>
  }

  // export { Knuckles };
}

export default ns;
