import type { Attribute, Element } from "./element.js";
import type {
  Expression,
  Identifier,
  RawExpression,
  RawIdentifier,
} from "./primitives.js";
import type { KoVirtualElement } from "./virtual-element.js";
import { Range, type RawRange } from "@knuckles/location";

export interface BindingInit {
  name: Identifier;
  param: Expression;
  attribute?: Attribute | null | undefined;
  parent: Element | KoVirtualElement;
  incomplete?: boolean | undefined;
}

export interface RawBinding extends RawRange {
  name: RawIdentifier;
  param: RawExpression;
  incomplete: boolean;
}

export class Binding extends Range {
  name: Identifier;
  param: Expression;
  attribute: Attribute | undefined;
  parent: Element | KoVirtualElement;
  incomplete: boolean;

  constructor(init: BindingInit) {
    super(init.name.start, init.param.end);
    this.name = init.name;
    this.param = init.param;
    this.attribute = init.attribute ?? undefined;
    this.parent = init.parent;
    this.incomplete = init.incomplete ?? false;
  }

  override toJSON(): RawBinding {
    return {
      ...super.toJSON(),
      name: this.name.toJSON(),
      param: this.param.toJSON(),
      incomplete: this.incomplete,
    };
  }
}
