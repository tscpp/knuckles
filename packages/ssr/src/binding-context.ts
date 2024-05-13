import ko from "knockout";

export interface BindingContextOptions {
  [key: string]: unknown;
}

export interface ChildContextOptions extends BindingContextOptions {
  as?: string | undefined;
  extend?: ChildBindingContextExtendCallback | undefined;
  noChildContext?: boolean | undefined;
}

export type BindingContextExtendCallback = (
  self: BindingContext,
  parentContext: BindingContext | null | undefined,
  dataItem: unknown,
) => void;

export type ChildBindingContextExtendCallback = (self: BindingContext) => void;

const contextAncestorBindingInfo = Symbol.for("_ancestorBindingInfo");
const inheritParentVm = {};

export class BindingContext {
  [contextAncestorBindingInfo]: unknown;
  [key: string]: unknown;

  $parent?: unknown;
  $parents: unknown[] = [];
  $root: unknown;
  $data: unknown;
  $index?: number;
  $parentContext?: BindingContext | null | undefined;
  $rawData: unknown;
  $ssr? = true as const;
  $component?: unknown;
  $componentTemplateNodes?: unknown;

  constructor(
    dataItemOrAccessor?: unknown,
    parentContext?: BindingContext | null | undefined,
    dataItemAlias?: string | null | undefined,
    extendCallback?: BindingContextExtendCallback | null | undefined,
    _options?: BindingContextOptions | null | undefined,
  ) {
    const shouldInheritData = dataItemOrAccessor === inheritParentVm;
    const realDataItemOrAccessor = shouldInheritData
      ? undefined
      : dataItemOrAccessor;
    const isFunc =
      typeof realDataItemOrAccessor == "function" &&
      !ko.isObservable(realDataItemOrAccessor);
    const dataItemOrObservable = isFunc
      ? realDataItemOrAccessor()
      : realDataItemOrAccessor;
    let dataItem = ko.utils.unwrapObservable(dataItemOrObservable);

    if (parentContext) {
      ko.utils.extend(this, parentContext);

      if (contextAncestorBindingInfo in parentContext) {
        this[contextAncestorBindingInfo] =
          parentContext[contextAncestorBindingInfo];
      }
    } else {
      this.$root = dataItem;
    }

    if (shouldInheritData) {
      dataItem = this.$data;
    } else {
      this.$rawData = dataItemOrObservable;
      this.$data = dataItem;
    }

    if (dataItemAlias) {
      this[dataItemAlias] = dataItem;
    }

    if (extendCallback) {
      extendCallback(this, parentContext, dataItem);
    }
  }

  createChildContext(
    dataItemOrAccessor?: unknown,
    dataItemAlias?: string | ChildContextOptions | null | undefined,
    extendCallback?: ChildBindingContextExtendCallback | null | undefined,
    options?: ChildContextOptions | null | undefined,
  ) {
    if (!options && dataItemAlias && typeof dataItemAlias == "object") {
      options = dataItemAlias;
      dataItemAlias = options["as"];
      extendCallback = options["extend"];
    }

    if (dataItemAlias && options && options["noChildContext"]) {
      return new BindingContext(
        inheritParentVm,
        this,
        null,
        (self) => {
          if (extendCallback) {
            extendCallback(self);
          }

          self[dataItemAlias as string] =
            typeof dataItemOrAccessor == "function" &&
            !ko.isObservable(dataItemOrAccessor)
              ? dataItemOrAccessor()
              : dataItemOrAccessor;
        },
        options,
      );
    }

    return new BindingContext(
      dataItemOrAccessor,
      this,
      dataItemAlias as string | null | undefined,
      (self, parentContext) => {
        self.$parentContext = parentContext;
        self.$parent = parentContext?.$data;
        self.$parents = (parentContext?.$parents || []).slice(0);
        self.$parents.unshift(self["$parent"]);

        if (extendCallback) {
          extendCallback(self);
        }
      },
      options,
    );
  }

  extend(
    properties: ko.MaybeSubscribable<unknown>,
    options?: BindingContextOptions | null | undefined,
  ) {
    return new BindingContext(
      inheritParentVm,
      this,
      null,
      (self) => {
        ko.utils.extend(
          self,
          typeof properties == "function" ? properties(self) : properties,
        );
      },
      options,
    );
  }
}
