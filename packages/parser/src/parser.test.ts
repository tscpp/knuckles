import { parse } from "./parse.js";
import { test, describe, expect } from "@jest/globals";

describe("parser", () => {
  test("Deep virtual elements", () => {
    const { document } = parse(
      "<!-- ko foo: foo --><!-- ko bar: bar --><!-- /ko --><!-- /ko -->",
    );
    expect(document).toMatchSnapshot();
  });

  test("Element bindings", () => {
    const { document } = parse("<div data-bind='0: bar'></div>");
    expect(document).toMatchSnapshot();
  });

  test("Emits error on invalid element binding", () => {
    const { errors } = parse("<div data-bind='foo: bar)'></div>");
    expect(errors.length).toEqual(1);
  });

  test("Import statement with *", () => {
    parse("<!-- ok with: * from 'foo' --><!-- /ok -->");
  });
});
