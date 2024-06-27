import { ParentNode, type ParentNodeInit, type RawParentNode } from "./node.js";

export interface SyntaxTreeInit extends ParentNodeInit {}

export interface RawSyntaxTree extends RawParentNode {}

export class SyntaxTree extends ParentNode {
  constructor(init: SyntaxTreeInit) {
    super(init);
  }

  override toJSON(): RawSyntaxTree {
    return super.toJSON();
  }
}
