import type { Range } from "@knuckles/location";

export abstract class Node {
  constructor(public range: Range) {}
}

export class Text extends Node {
  constructor(
    public readonly content: string,
    range: Range,
  ) {
    super(range);
  }
}

export class Comment extends Node {
  constructor(
    public readonly content: string,
    range: Range,
  ) {
    super(range);
  }
}

export class Scope {
  constructor(
    public readonly text: string,
    public readonly range: Range,
  ) {}
}

export class Attribute {
  constructor(
    public readonly name: Scope,
    public readonly value: Scope,
    public readonly namespace: string | undefined,
    public readonly prefix: string | undefined,
    public readonly quote: "'" | '"' | null,
    public readonly range: Range,
  ) {}
}

export class Binding {
  constructor(
    public readonly name: Scope,
    public readonly param: Scope,
    public readonly parent: Attribute | VirtualElement,
    public readonly range: Range,
  ) {}
}

export class Element extends Node {
  constructor(
    public readonly tagName: string,
    public readonly attributes: readonly Attribute[],
    public readonly bindings: readonly Binding[],
    public readonly children: readonly Node[],
    range: Range,
  ) {
    super(range);
  }
}

export class VirtualElement extends Node {
  constructor(
    public readonly binding: Binding,
    public readonly hidden: boolean,
    public readonly children: readonly Node[],
    public readonly start: Comment,
    public readonly end: Comment,
    range: Range,
  ) {
    super(range);
  }
}

export class Document extends Node {
  constructor(
    public readonly children: readonly Node[],
    range: Range,
  ) {
    super(range);
  }
}

export type ChildNode = Element | VirtualElement | Text | Comment;

export function isChildNode(node: Node): node is ChildNode {
  return (
    node instanceof Element ||
    node instanceof VirtualElement ||
    node instanceof Text ||
    node instanceof Comment
  );
}

export type ParentNode = Element | VirtualElement | Document;

export function isParentNode(node: Node): node is ParentNode {
  return (
    node instanceof Element ||
    node instanceof VirtualElement ||
    node instanceof Document
  );
}
