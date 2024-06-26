import { ParentNode, type ParentNodeInit, type RawParentNode } from "./node.js";

export interface DocumentInit extends ParentNodeInit {}

export interface RawDocument extends RawParentNode {}

export class Document extends ParentNode {
  constructor(init: DocumentInit) {
    super(init);
  }

  override toJSON(): RawDocument {
    return super.toJSON();
  }
}
