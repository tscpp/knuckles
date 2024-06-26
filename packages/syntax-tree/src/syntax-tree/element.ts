import type { Binding, RawBinding } from "./binding.js";
import {
  type Node,
  ParentNode,
  type ParentNodeInit,
  type RawParentNode,
} from "./node.js";
import type {
  Identifier,
  RawIdentifier,
  RawStringLiteral,
  StringLiteral,
} from "./primitives.js";
import { Range, type RawRange } from "@knuckles/location";

export interface ElementInit extends ParentNodeInit {
  tagName: Identifier;
  attributes: Iterable<Attribute>;
  bindings: Iterable<Binding>;
  children: Iterable<Node>;
  inner: Range;
}

export interface RawElement extends RawParentNode {
  type: "element";
  tagName: RawIdentifier;
  attributes: RawAttribute[];
  bindings: RawBinding[];
  inner: RawRange;
}

export class Element extends ParentNode {
  tagName: Identifier;
  attributes: Attribute[];
  bindings: Binding[];
  inner: Range;

  constructor(init: ElementInit) {
    super(init);
    this.tagName = init.tagName;
    this.attributes = Array.from(init.attributes);
    this.bindings = Array.from(init.bindings);
    this.inner = init.inner;
  }

  override toJSON(): RawElement {
    return {
      ...super.toJSON(),
      type: "element",
      tagName: this.tagName.toJSON(),
      attributes: this.attributes.map((attribute) => attribute.toJSON()),
      bindings: this.bindings.map((binding) => binding.toJSON()),
      inner: this.inner.toJSON(),
    };
  }
}

export interface AttributeInit {
  name: Identifier;
  value: StringLiteral;
  namespace?: string | null | undefined;
  prefix?: string | null | undefined;
  range: Range;
  parent: Element;
}

export type Quotation = "single" | "double";

export interface RawAttribute extends RawRange {
  name: RawIdentifier;
  value: RawStringLiteral;
  namespace: string | null;
  prefix: string | null;
}

export class Attribute extends Range {
  name: Identifier;
  value: StringLiteral;
  namespace: string | null;
  prefix: string | null;
  parent: Element;

  constructor(init: AttributeInit) {
    super(init.range);
    this.name = init.name;
    this.value = init.value;
    this.namespace = init.namespace ?? null;
    this.prefix = init.prefix ?? null;
    this.parent = init.parent;
  }

  override toJSON(): RawAttribute {
    return {
      ...super.toJSON(),
      name: this.name.toJSON(),
      value: this.value.toJSON(),
      namespace: this.namespace,
      prefix: this.prefix,
    };
  }
}
