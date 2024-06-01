import Renderer from "./renderer.js";
import { parse } from "@knuckles/parser";
import { describe, test, expect, beforeAll } from "bun:test";
import assert from "node:assert/strict";
import { Project } from "ts-morph";

describe("Renderer", () => {
  let project: Project;

  beforeAll(async () => {
    project = new Project();
  });

  const render = (text: string) => {
    const result = parse(text);
    expect(result.errors).toHaveLength(0);
    assert(result.document);
    return new Renderer({
      project,
      document: result.document,
    }).render();
  };

  test("renders context deconstruction", () => {
    const chunk = render("<div data-bind='foo: bar'></div>");
    expect(chunk.text()).toContain("$parent");
  });
});
