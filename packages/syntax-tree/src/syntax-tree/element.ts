import type { Binding } from "./binding.js";
import { Node } from "./node.js";
import type { Identifier, StringLiteral } from "./primitives.js";
import { Range } from "@knuckles/location";

export interface ElementInit {
  tagName: Identifier;
  attributes: Iterable<Attribute>;
  bindings: Iterable<Binding>;
  children: Iterable<Node>;
  range: Range;
  inner: Range;
}

export class Element extends Node {
  tagName: Identifier;
  attributes: Attribute[];
  bindings: Binding[];
  children: Node[];
  inner: Range;

  constructor(init: ElementInit) {
    super(init);
    this.tagName = init.tagName;
    this.attributes = Array.from(init.attributes);
    this.bindings = Array.from(init.bindings);
    this.children = Array.from(init.children);
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
