import { Node, type NodeInit, type RawNode } from "./node.js";

export interface TextInit extends NodeInit {
  content: string;
}

export interface RawText extends RawNode {
  type: "text";
  content: string;
}

export class Text extends Node {
  content: string;

  constructor(init: TextInit) {
    super(init);
    this.content = init.content;
  }

  override toJSON(): RawText {
    return {
      ...super.toJSON(),
      type: "text",
      content: this.content,
    };
  }
}
