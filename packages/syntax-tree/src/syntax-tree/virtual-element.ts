import type { Binding, RawBinding } from "./binding.js";
import type { Comment, RawComment } from "./comment.js";
import { ParentNode, type ParentNodeInit, type RawParentNode } from "./node.js";
import type {
  Expression,
  Identifier,
  RawExpression,
  RawIdentifier,
  RawStringLiteral,
  StringLiteral,
} from "./primitives.js";
import { Range, type RawRange } from "@knuckles/location";

export interface VirtualElementInit extends ParentNodeInit {
  namespace: Identifier;
  expression: Expression;
  startComment: Comment;
  endComment: Comment;
}

export interface RawVirtualElement extends RawParentNode {
  type: "virtual-element";
  namespace: RawIdentifier;
  expression: RawExpression;
  startComment: RawComment;
  endComment: RawComment;
  inner: RawRange;
}

export class VirtualElement extends ParentNode {
  namespace: Identifier;
  expression: Expression;
  startComment: Comment;
  endComment: Comment;
  inner: Range;

  constructor(init: VirtualElementInit) {
    super(init);
    this.namespace = init.namespace;
    this.expression = init.expression;
    this.startComment = init.startComment;
    this.endComment = init.endComment;
    this.inner = new Range(init.startComment.end, init.endComment.start);
  }

  override toJSON(): RawVirtualElement {
    return {
      ...super.toJSON(),
      type: "virtual-element",
      namespace: this.namespace.toJSON(),
      expression: this.expression.toJSON(),
      startComment: this.startComment.toJSON(),
      endComment: this.endComment.toJSON(),
      inner: this.inner.toJSON(),
    };
  }
}

export interface KoVirtualElementInit extends VirtualElementInit {
  bindings: Iterable<Binding>;
}

export interface RawKoVirtualElementInit extends RawVirtualElement {
  bindings: RawBinding[];
}

export class KoVirtualElement extends VirtualElement {
  bindings: Binding[];

  /**
   * @deprecated Use {@link bindings} instead.
   */
  get binding() {
    return this.bindings[0]!;
  }

  constructor(init: KoVirtualElementInit) {
    super(init);
    this.bindings = Array.from(init.bindings);
  }

  override toJSON(): RawKoVirtualElementInit {
    return {
      ...super.toJSON(),
      bindings: this.bindings.map((binding) => binding.toJSON()),
    };
  }
}

export interface ImportStatementInit {
  range: Range;
  isTypeOnly: boolean;
  identifier: Identifier;
  module: StringLiteral;
}

export interface RawImportStatement extends RawRange {
  isTypeOnly: boolean;
  identifier: RawIdentifier;
  module: RawStringLiteral;
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

  override toJSON(): RawImportStatement {
    return {
      ...super.toJSON(),
      identifier: this.identifier.toJSON(),
      isTypeOnly: this.isTypeOnly,
      module: this.module.toJSON(),
    };
  }
}

export interface OkVirtualElementInit extends VirtualElementInit {
  name: Identifier;
  param: Expression;
  import?: ImportStatement | undefined;
}

export interface RawOkVirtualElement extends RawVirtualElement {
  name: RawIdentifier;
  param: RawExpression;
  import: RawImportStatement | undefined;
}

export class OkVirtualElement extends VirtualElement {
  name: Identifier;
  param: Expression;
  import: ImportStatement | undefined;

  constructor(init: OkVirtualElementInit) {
    super(init);
    this.name = init.name;
    this.param = init.param;
    this.import = init.import;
  }

  override toJSON(): RawOkVirtualElement {
    return {
      ...super.toJSON(),
      name: this.name.toJSON(),
      param: this.param.toJSON(),
      import: this.import?.toJSON(),
    };
  }
}
