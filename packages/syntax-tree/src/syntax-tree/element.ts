import type { Binding } from "./binding.js";
import { type Node, ParentNode, type ParentNodeInit } from "./node.js";
import type { Identifier, StringLiteral } from "./primitives.js";
import { Range } from "@knuckles/location";

export interface ElementInit extends ParentNodeInit {
  tagName: Identifier;
  attributes: Iterable<Attribute>;
  bindings: Iterable<Binding>;
  children: Iterable<Node>;
  inner: Range;
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
}
