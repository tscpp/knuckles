import { transform } from "./eval.js";
import { invertQuote } from "./utils.js";
import type { Range } from "@knuckles/location";
import {
  type Attribute,
  Element,
  type VirtualElement,
} from "@knuckles/syntax-tree";

export class Binding {
  constructor(
    public readonly name: string,
    public readonly expression: string,
    public readonly quote: "'" | '"',
    public readonly parent: Element | VirtualElement,
    public readonly range: Range,
  ) {}
}

export function parseBindings(node: Element | VirtualElement) {
  if (node instanceof Element) {
    return parseFromElement(node);
  } else {
    return [parseFromVirtualElement(node)];
  }
}

function parseFromElement(node: Element) {
  return node.bindings.map((binding) => {
    const quote = invertQuote((binding.parent as Attribute).quote ?? '"');
    return new Binding(
      binding.name.text,
      transform(binding.param.text, quote),
      quote,
      node,
      binding.range,
    );
  });
}

function parseFromVirtualElement(node: VirtualElement) {
  return new Binding(
    node.binding.name.text!,
    transform(node.binding.param.text),
    '"',
    node,
    node.binding.range,
  );
}
