import { type Binding } from "./binding.js";
import { Position, Range } from "@knuckles/location";
import {
  parse5,
  parse5LocationToRange,
  type parse5TreeAdapter,
} from "@knuckles/parser";
import { Element, type VirtualElement } from "@knuckles/syntax-tree";
import inlineStyleParser from "inline-style-parser";
import * as ko from "knockout";
import type MagicString from "magic-string";
import { createHash } from "node:crypto";

export function getInnerRange(
  node: Element | VirtualElement,
  document: string,
): Range {
  if (node instanceof Element) {
    return getInnerRangeOfElement(node, document);
  } else {
    return getInnerRangeOfVirtualElement(node, document);
  }
}

function getInnerRangeOfElement(node: Element, document: string): Range {
  if (node.children.length > 0) {
    return new Range(
      node.children[0]!.range.start,
      node.children.at(-1)!.range.end,
    );
  }

  const outer = document.slice(node.range.start.offset, node.range.end.offset);
  let quote = false,
    escape = false;
  let offset: number | undefined;

  for (const [i, char] of Array.from(outer).entries()) {
    if (char === '"' && !escape) {
      quote = !quote;
    }

    escape = quote && char === "\\";

    if (!quote && char === ">") {
      offset = node.range.start.offset + i + 1;
      break;
    }
  }

  if (offset === undefined) {
    throw new Error("Unterminated element");
  }

  // We can assume the start and end offset is the same because the node has no
  // children.
  return new Range(
    Position.fromOffset(offset, document),
    Position.fromOffset(offset, document),
  );
}

function getInnerRangeOfVirtualElement(
  node: VirtualElement,
  _document: string,
): Range {
  return new Range(node.start.range.end, node.end.range.start);
}

export function escapeHtml(string: string) {
  return string
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function setStyle(
  generated: MagicString,
  element: Element,
  property: string,
  value: string | null,
) {
  const attr = element.attributes.find((attr) => attr.name.text === "style");

  if (attr) {
    const styles = (inlineStyleParser as any)(attr.value);

    for (const style of styles) {
      if (style.type === "declaration" && style.property === property) {
        let range = new Range(
          Position.fromLineAndColumn(
            style.position.start.line,
            style.position.start.column,
            attr.value.text,
          ),
          Position.fromLineAndColumn(
            style.position.end.line,
            style.position.end.column,
            attr.value.text,
          ),
        );
        range = Range.translate(
          range,
          attr.range.start.offset,
          generated.original,
        );
        generated.remove(...range.offsets);
      }
    }

    if (value !== null) {
      generated.appendLeft(attr.range.start.offset, `${property}: ${value};`);
    }
  } else if (value !== null) {
    setAttribute(generated, element, "style", `${property}: ${value};`);
  }
}

export function hasClass(
  generated: MagicString,
  element: Element,
  className: string,
): boolean {
  const attr = getAttribute(generated, element, "class");

  if (attr === null) {
    return false;
  } else {
    const classes = attr.split(/\s+/);
    return classes.includes(className);
  }
}

export function addClass(
  generated: MagicString,
  element: Element,
  className: string,
) {
  const attr = getAttribute(generated, element, "class");

  if (attr === null) {
    setAttribute(generated, element, "class", className);
  } else {
    const classes = attr.split(/\s+/);
    if (classes.includes(className)) return;
    classes.push(className);
    const value = classes.join(" ");
    setAttribute(generated, element, "class", value);
  }
}

export function removeClass(
  generated: MagicString,
  element: Element,
  className: string,
) {
  const attr = getAttribute(generated, element, "class");

  if (attr !== null) {
    const classes = attr.split(/\s+/);
    const index = classes.indexOf(className);
    if (index !== -1) {
      classes.splice(index, 1);
      const value = classes.join(" ");
      setAttribute(generated, element, "class", value);
    }
  }
}

export function getAttribute(
  generated: MagicString,
  element: Element,
  name: string,
): string | null {
  const fragment5 = parse5.parseFragment(
    generated.slice(...element.range.offsets),
    {
      sourceCodeLocationInfo: true,
    },
  );
  const element5 = fragment5.childNodes[0] as parse5TreeAdapter.Element;
  const attr5 = element5.attrs.find((attr) => attr.name === name);
  return attr5?.value ?? null;
}

export function setAttribute(
  generated: MagicString,
  element: Element,
  name: string,
  value: string | null,
) {
  const fragment5 = parse5.parseFragment(
    generated.slice(...element.range.offsets),
    {
      sourceCodeLocationInfo: true,
    },
  );
  const element5 = fragment5.childNodes[0] as parse5TreeAdapter.Element;

  if (element5.attrs.find((attr) => attr.name === name)) {
    const range = parse5LocationToRange(
      element5.sourceCodeLocation!.attrs![name]!,
    );

    if (value === null) {
      generated.remove(range.start.offset, range.end.offset);
    } else {
      generated.update(range.start.offset, range.end.offset, escapeHtml(value));
    }
  } else if (value !== null) {
    const innerRange = getInnerRange(element, generated.original);
    generated.appendLeft(
      innerRange.start.offset - 1,
      ` ${name}="${escapeHtml(value)}"`,
    );
  }
}

export function randomId(data = Math.random().toString()) {
  return createHash("sha256").update(data).digest("base64url").slice(0, 8);
}

export function escapeJs(
  string: string,
  quote: string | null | undefined = null,
) {
  string = string
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\r")
    .replaceAll("\t", "\\t");

  if (quote !== "'") {
    string = string.replaceAll('"', '\\"');
  }

  if (quote !== '"') {
    string = string.replaceAll("'", "\\'");
  }

  return string;
}

export function extractIntoTemplate(binding: Binding, generated: MagicString) {
  const inner = getInnerRange(binding.parent, generated.original);
  const innerHtml = generated.slice(inner.start.offset, inner.end.offset);

  // Generate hash
  const id = randomId(innerHtml.replace(/\s+/g, " "));

  // Remove contents
  generated.remove(...inner.offsets);

  // Append template above element
  generated.appendLeft(
    binding.parent.range.start.offset,
    `<template id="${id}">${innerHtml}</template>`,
  );

  return id;
}

export function unwrap<T>(value: ko.MaybeSubscribable<T>): T {
  return ko.unwrap(value);
}

export function invertQuote(quote: '"' | "'"): '"' | "'" {
  return quote === '"' ? "'" : '"';
}
