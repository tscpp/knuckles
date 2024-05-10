import { render } from "../src/lib/exports.js";
import { test, describe } from "bun:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";

// Prettier can format the template literals as html when tagged.
const html = String.raw;

describe("non-strict", () => {
  test("handles non-existent viewmodel", async () => {
    const { document, errors } = await render(
      html`
        <!-- #ko with: default from "./does-not-exist.js" -->
        <div data-bind="text: text"></div>
        <!-- /ko -->
      `,
      {
        filename: resolve(import.meta.dir, "__fixtures__/unnamed.html"),
      },
    );
    assert(
      errors.some((error) => error.code === "cannot-find-module"),
      "Could not find 'cannot-find-module' error",
    );
    assert(document);
    assert(document.includes("><"));
  });

  test.todo("handles invalid binding expression", async () => {
    const source = html`
      <!-- #ko with: {} -->
      <div data-bind="text: ???"></div>
      <!-- /ko -->
    `;
    const { document, errors } = await render(source, {
      filename: resolve(import.meta.dir, "__fixtures__/unnamed.html"),
    });
    const error = errors.find((error) => error.code === "binding-parse-error");
    assert(error, "Could not find 'binding-parse-error' error");
    assert(
      source.at(error!.range!.start.offset) === "?",
      "Error has invalid start offset",
    );
    assert(
      source.at(error!.range!.end.offset) === "?",
      "Error has invalid end offset",
    );
    assert(document);
    assert(document.includes("><"));
  });

  test("handle error when evaluating binding", async () => {
    const source = html`
      <!-- #ko with: {} -->
      <div data-bind="text: window.foo.bar.baz"></div>
      <!-- /ko -->
    `;
    const { document, errors } = await render(source, {
      filename: resolve(import.meta.dir, "__fixtures__/unnamed.html"),
    });
    const error = errors.find(
      (error) => error.code === "binding-evaluation-error",
    );
    assert(error, "Could not find 'binding-evaluation-error' error");
    assert(document);
    assert(document.includes("><"));
  });
});
