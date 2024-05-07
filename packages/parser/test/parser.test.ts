import { parse } from "../src/parser.js";
import { DirectiveElement } from "@knuckles/syntax-tree";
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
    assert(document.children[0] instanceof DirectiveElement);
  });

  test("Element bindings", () => {
    const document = parse("<div data-bind='0: bar'></div>");
    expect(document).toMatchSnapshot();
  });
});
