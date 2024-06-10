import { Node, type NodeInit } from "./node.js";

export interface TextInit extends NodeInit {
  content: string;
}

export class Text extends Node {
  content: string;

  constructor(init: TextInit) {
    super(init);
    this.content = init.content;
  }
}
