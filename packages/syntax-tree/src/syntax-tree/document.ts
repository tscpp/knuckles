import { Node } from "./node.js";
import type { Range } from "@knuckles/location";

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
