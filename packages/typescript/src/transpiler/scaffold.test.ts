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
    expect(chunk.content).toContain("foo");
    expect(chunk.content).toContain("bar");
  });

  test("renders 'with' directive", () => {
    const chunk = render(
      "<!-- ok with: default from 'viewmodel' --><div data-bind='text: text'></div><!-- /ok -->",
    );
    expect(chunk.content).toContain('(typeof import("viewmodel"))["default"]');
  });
});
