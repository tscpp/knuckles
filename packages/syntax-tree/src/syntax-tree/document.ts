import { ParentNode, type ParentNodeInit } from "./node.js";

export interface DocumentInit extends ParentNodeInit {}

export class Document extends ParentNode {
  constructor(init: DocumentInit) {
    super(init);
  }
}
