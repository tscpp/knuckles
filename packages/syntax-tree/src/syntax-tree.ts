import { Range } from "@knuckles/location";

export interface NodeInit {
  range: Range;
}

export abstract class Node {
  range: Range;

  constructor(init: NodeInit) {
    this.range = init.range;
  }
}

export interface TextInit {
  content: string;
  range: Range;
}

export class Text extends Node {
  content: string;

  constructor(init: TextInit) {
    super(init);
    this.content = init.content;
  }
}

export interface CommentInit {
  content: string;
  range: Range;
}

export class Comment extends Node {
  content: string;

  constructor(init: CommentInit) {
    super(init);
    this.content = init.content;
  }
}

export interface ScopeInit {
  text: string;
  range: Range;
}

export class Scope {
  text: string;
  range: Range;

  constructor(init: ScopeInit) {
    this.text = init.text;
    this.range = init.range;
  }
}

export interface AttributeInit {
  name: Scope;
  value: Scope;
  namespace?: string | null | undefined;
  prefix?: string | null | undefined;
  quote: "'" | '"' | null;
  range: Range;
}

export class Attribute {
  name: Scope;
  value: Scope;
  namespace: string | null;
  prefix: string | null;
  quote: "'" | '"' | null;
  range: Range;

  constructor(init: AttributeInit) {
    this.name = init.name;
    this.value = init.value;
    this.namespace = init.namespace ?? null;
    this.prefix = init.prefix ?? null;
    this.quote = init.quote;
    this.range = init.range;
  }
}

export interface BindingInit {
  name: Scope;
  param: Scope;
  attribute?: Attribute | null | undefined;
}

export class Binding {
  name: Scope;
  param: Scope;
  attribute: Attribute | null;
  range: Range;

  constructor(init: BindingInit) {
    this.name = init.name;
    this.param = init.param;
    this.attribute = init.attribute ?? null;
    this.range = new Range(init.name.range.start, init.param.range.end);
  }
}

export interface ElementInit {
  tagName: string;
  attributes: Iterable<Attribute>;
  bindings: Iterable<Binding>;
  children: Iterable<Node>;
  range: Range;
}

export class Element extends Node {
  tagName: string;
  attributes: Attribute[];
  bindings: Binding[];
  children: Node[];

  constructor(init: ElementInit) {
    super(init);
    this.tagName = init.tagName;
    this.attributes = Array.from(init.attributes);
    this.bindings = Array.from(init.bindings);
    this.children = Array.from(init.children);
  }
}

export interface VirtualElementInit {
  binding: Binding;
  children: Iterable<Node>;
  startComment: Comment;
  endComment: Comment;
}

export class VirtualElement extends Node {
  binding: Binding;
  children: Node[];
  startComment: Comment;
  endComment: Comment;

  constructor(init: VirtualElementInit) {
    super({
      range: new Range(
        init.startComment.range.start,
        init.endComment.range.end,
      ),
    });
    this.binding = init.binding;
    this.children = Array.from(init.children);
    this.startComment = init.startComment;
    this.endComment = init.endComment;
  }
}

export interface DirectiveInit {
  name: Scope;
  param?: Scope | null | undefined;
  children: Iterable<Node>;
  startComment: Comment;
  endComment: Comment;
}

export class Directive extends Node {
  name: Scope;
  param: Scope | null;
  children: Node[];
  startComment: Comment;
  endComment: Comment;

  constructor(init: DirectiveInit) {
    super({
      range: new Range(
        init.startComment.range.start,
        init.endComment.range.end,
      ),
    });
    this.name = init.name;
    this.param = init.param ?? null;
    this.children = Array.from(init.children);
    this.startComment = init.startComment;
    this.endComment = init.endComment;
  }
}

export interface DocumentInit {
  children: Iterable<Node>;
  range: Range;
}

export class Document extends Node {
  children: Node[];

  constructor(init: DocumentInit) {
    super(init);
    this.children = Array.from(init.children);
  }
}

export type ChildNode = Element | VirtualElement | Directive | Text | Comment;

export function isChildNode(node: Node): node is ChildNode {
  return (
    node instanceof Element ||
    node instanceof VirtualElement ||
    node instanceof Directive ||
    node instanceof Text ||
    node instanceof Comment
  );
}

export type ParentNode = Element | VirtualElement | Directive | Document;

export function isParentNode(node: Node): node is ParentNode {
  return (
    node instanceof Element ||
    node instanceof VirtualElement ||
    node instanceof Directive ||
    node instanceof Document
  );
}
