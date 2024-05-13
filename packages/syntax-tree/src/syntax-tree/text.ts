import type { Range } from "@knuckles/location";
import { Node } from "./node.js";

export interface TextInit {
  content: string;
  range: Range;
}

export class Text extends Node {
  content: string;

  constructor(init: TextInit) {
    super(init);
    this.content = init.content;
  }
}
