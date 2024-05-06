import { parse } from "../src/parser.js";
import { VirtualElement } from "@knuckles/syntax-tree";
import { describe, test, expect } from "bun:test";
import assert from "node:assert/strict";

describe("parser", () => {
  test("Deep virtual elements", () => {
    const document = parse(
      "<!-- ko foo: foo --><!-- ko bar: bar --><!-- /ko --><!-- /ko -->",
    );
    expect(document).toMatchSnapshot();
  });

  test("Hidden virtual element", () => {
    const document = parse("<!-- #ko foo: foo --><!-- /ko -->");
    expect(document).toMatchSnapshot();
    assert(document.children[0] instanceof VirtualElement);
    expect(document.children[0].hidden).toBe(true);
  });

  test("Element bindings", () => {
    const document = parse("<div data-bind='0: bar'></div>");
    expect(document).toMatchSnapshot();
  });
});
