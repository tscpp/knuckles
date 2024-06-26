import { Node, type NodeInit, type RawNode } from "./node.js";

export interface CommentInit extends NodeInit {
  content: string;
}

export interface RawComment extends RawNode {
  type: "comment";
  content: string;
}

export class Comment extends Node {
  content: string;

  constructor(init: CommentInit) {
    super(init);
    this.content = init.content;
  }

  override toJSON(): RawComment {
    return {
      ...super.toJSON(),
      type: "comment",
      content: this.content,
    };
  }
}
