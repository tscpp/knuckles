import { Comment } from "./syntax-tree/comment.js";
import { Document } from "./syntax-tree/document.js";
import { Element } from "./syntax-tree/element.js";
import type { Node } from "./syntax-tree/node.js";
import { Text } from "./syntax-tree/text.js";
import { VirtualElement } from "./syntax-tree/virtual-element.js";

export type ChildNode = Element | VirtualElement | Text | Comment;

export function isChildNode(node: Node): node is ChildNode {
  return (
    node instanceof Element ||
    node instanceof VirtualElement ||
    node instanceof Text ||
    node instanceof Comment
  );
}

export type ParentNode = Element | VirtualElement | Document;

export function isParentNode(node: Node): node is ParentNode {
  return (
    node instanceof Element ||
    node instanceof VirtualElement ||
    node instanceof Document
  );
}
