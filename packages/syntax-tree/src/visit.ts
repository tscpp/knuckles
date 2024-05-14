import { isParentNode } from "./collections.js";
import type { Node } from "./syntax-tree/node.js";

export function visit<T extends Node>(
  node: Node,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type: new (..._: any) => T,
  callback: (node: T) => void,
): void {
  if (node instanceof type) {
    callback(node);
  }

  if (isParentNode(node)) {
    for (const child of node.children) {
      visit(child, type, callback);
    }
  }
}
