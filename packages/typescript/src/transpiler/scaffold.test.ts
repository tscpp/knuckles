import Scaffold from "./scaffold.js";
import { parse } from "@knuckles/parser";
import { describe, test, expect } from "bun:test";
import assert from "node:assert/strict";

describe("Scaffold", () => {
  const render = (text: string) => {
    const result = parse(text);
    expect(result.errors).toHaveLength(0);
    assert(result.document);
    return new Scaffold().render(result.document);
  };

  test("transpiles element binding", () => {
    const chunk = render("<div data-bind='foo: bar'></div>");
    expect(chunk.text()).toContain("foo");
    expect(chunk.text()).toContain("bar");
  });

  test("renders 'with' directive", () => {
    const chunk = render(
      "<!-- ok with: default from 'viewmodel' --><div data-bind='text: text'></div><!-- /ok -->",
    );
    expect(chunk.text()).toContain('typeof import("viewmodel")');
  });

  test("generates mappings", () => {
    const chunk = render("<div data-bind='foo: bar'></div>");
    const mappings = chunk
      .mappings()
      .map((mapping) => mapping.capture(chunk.text()));
    expect(mappings.length).toBeGreaterThan(0);
  });
});
