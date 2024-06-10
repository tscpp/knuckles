import { Node, type NodeInit } from "./node.js";

export interface CommentInit extends NodeInit {
  content: string;
}

export class Comment extends Node {
  content: string;

  constructor(init: CommentInit) {
    super(init);
    this.content = init.content;
  }
}
