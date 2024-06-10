import type { Attribute, Element } from "./element.js";
import type { Expression, Identifier } from "./primitives.js";
import type { KoVirtualElement } from "./virtual-element.js";
import { Range } from "@knuckles/location";

export interface BindingInit {
  name: Identifier;
  param: Expression;
  attribute?: Attribute | null | undefined;
  parent: Element | KoVirtualElement;
  incomplete?: boolean | undefined;
}

export class Binding extends Range {
  name: Identifier;
  param: Expression;
  attribute: Attribute | null;
  parent: Element | KoVirtualElement;
  incomplete: boolean;

  constructor(init: BindingInit) {
    super(init.name.start, init.param.end);
    this.name = init.name;
    this.param = init.param;
    this.attribute = init.attribute ?? null;
    this.parent = init.parent;
    this.incomplete = init.incomplete ?? false;
  }
}
