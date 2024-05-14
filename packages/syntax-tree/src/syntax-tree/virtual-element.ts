import type { Binding } from "./binding.js";
import type { Comment } from "./comment.js";
import { Node } from "./node.js";
import type { Expression, Identifier, StringLiteral } from "./primitives.js";
import { Range } from "@knuckles/location";

export interface VirtualElementInit {
  namespace: Identifier;
  name: Identifier;
  param: Expression;
  startComment: Comment;
  children: Iterable<Node>;
  endComment: Comment;
}

export class VirtualElement extends Node {
  namespace: Identifier;
  name: Identifier;
  param: Expression;
  startComment: Comment;
  children: Node[];
  endComment: Comment;
  inner: Range;

  constructor(init: VirtualElementInit) {
    super({
      range: new Range(init.startComment.start, init.endComment.end),
    });
    this.namespace = init.namespace;
    this.name = init.name;
    this.param = init.param;
    this.startComment = init.startComment;
    this.children = Array.from(init.children);
    this.endComment = init.endComment;
    this.inner = new Range(init.startComment.end, init.endComment.start);
  }
}

export interface KoVirtualElementInit extends VirtualElementInit {
  binding: Binding;
}

export class KoVirtualElement extends VirtualElement {
  binding: Binding;

  constructor(init: KoVirtualElementInit) {
    super(init);
    this.binding = init.binding;
  }
}

export interface ImportStatementInit {
  range: Range;
  isTypeOnly: boolean;
  identifier: Identifier;
  module: StringLiteral;
}

export class ImportStatement extends Range {
  isTypeOnly: boolean;
  identifier: Identifier;
  module: StringLiteral;

  constructor(init: ImportStatementInit) {
    super(init.range.start, init.range.end);
    this.isTypeOnly = init.isTypeOnly;
    this.identifier = init.identifier;
    this.module = init.module;
  }
}

export interface WithVirtualElementInit extends VirtualElementInit {
  import: ImportStatement;
}

export class WithVirtualElement extends VirtualElement {
  import: ImportStatement;

  constructor(init: WithVirtualElementInit) {
    super(init);
    this.import = init.import;
  }
}
