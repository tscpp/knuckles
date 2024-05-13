import { Position, Range } from "@knuckles/location";
import {
  parse5,
  parse5LocationToRange,
  type parse5TreeAdapter,
} from "@knuckles/parser";
import { type Binding, type Element } from "@knuckles/syntax-tree";
import inlineStyleParser from "inline-style-parser";
import * as ko from "knockout";
import type MagicString from "magic-string";
import { createHash } from "node:crypto";

//#region Escape
export function escapeHtml(string: string) {
  return string
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
//#endregion

//#region Attributes
export function getAttribute(
  generated: MagicString,
  element: Element,
  name: string,
): string | null {
  const fragment5 = parse5.parseFragment(generated.slice(...element.offsets), {
    sourceCodeLocationInfo: true,
  });
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
  const fragment5 = parse5.parseFragment(generated.slice(...element.offsets), {
    sourceCodeLocationInfo: true,
  });
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
    generated.appendLeft(
      element.inner.start.offset - 1,
      ` ${name}="${escapeHtml(value)}"`,
    );
  }
}
//#endregion

//#region Class attribute
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
//#endregion

//#region Style attribute
export function setStyle(
  generated: MagicString,
  element: Element,
  property: string,
  value: string | null,
) {
  const attr = element.attributes.find((attr) => attr.name.value === "style");

  if (attr) {
    const styles = (inlineStyleParser as any)(attr.value);

    for (const style of styles) {
      if (style.type === "declaration" && style.property === property) {
        let range = new Range(
          Position.fromLineAndColumn(
            style.position.start.line,
            style.position.start.column,
            attr.value.value,
          ),
          Position.fromLineAndColumn(
            style.position.end.line,
            style.position.end.column,
            attr.value.value,
          ),
        );
        range = Range.translate(range, attr.start.offset, generated.original);
        generated.remove(...range.offsets);
      }
    }

    if (value !== null) {
      generated.appendLeft(attr.start.offset, `${property}: ${value};`);
    }
  } else if (value !== null) {
    setAttribute(generated, element, "style", `${property}: ${value};`);
  }
}
//#endregion

//#region Templates
export function extractIntoTemplate(binding: Binding, generated: MagicString) {
  const innerHtml = generated.slice(...binding.parent.inner.offsets);

  // Generate hash
  const id = randomId(innerHtml.replace(/\s+/g, " "));

  // Remove contents
  generated.remove(...binding.parent.inner.offsets);

  // Append template above element
  generated.appendLeft(
    binding.parent.start.offset,
    `<template id="${id}">${innerHtml}</template>`,
  );

  return id;
}
//#endregion

//#region Misc
export function randomId(data = Math.random().toString()) {
  return createHash("sha256").update(data).digest("base64url").slice(0, 8);
}

export function unwrap<T>(value: ko.MaybeSubscribable<T>): T {
  return ko.unwrap(value);
}

export function invertQuote(quote: '"' | "'"): '"' | "'" {
  return quote === '"' ? "'" : '"';
}
//#endregion
