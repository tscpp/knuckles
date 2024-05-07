import Scaffold from "./scaffold.js";
import { describe, test, expect } from "bun:test";

describe("Scaffold", () => {
  test("transpiles element binding", () => {
    const chunk = new Scaffold().render("<div data-bind='foo: bar'></div>");
    expect(chunk.content).toContain("foo");
    expect(chunk.content).toContain("bar");
  });

  test("renders 'with' directive", () => {
    const chunk = new Scaffold().render(
      "<!-- #ko with: default from 'viewmodel' --><div data-bind='text: text'></div><!-- /ko -->",
    );
    expect(chunk.content).toContain('(typeof import("viewmodel"))["default"]');
  });
});
