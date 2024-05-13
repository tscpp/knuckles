import { Range } from "@knuckles/location";

export interface NodeInit {
  range: Range;
}

export abstract class Node extends Range {
  constructor(init: NodeInit) {
    super(init.range);
  }
}
