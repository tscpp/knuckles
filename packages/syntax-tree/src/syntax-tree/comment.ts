import { Node } from "./node.js";
import type { Range } from "@knuckles/location";

export interface CommentInit {
  content: string;
  range: Range;
}

export class Comment extends Node {
  content: string;

  constructor(init: CommentInit) {
    super(init);
    this.content = init.content;
  }
}
