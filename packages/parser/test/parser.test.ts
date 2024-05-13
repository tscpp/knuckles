import { parse } from "../src/parse.js";
import { describe, test, expect } from "bun:test";

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
});
