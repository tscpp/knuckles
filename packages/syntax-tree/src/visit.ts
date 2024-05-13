import { type Node, isParentNode } from "./collections.js";

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
