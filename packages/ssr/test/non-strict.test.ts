import { html, render } from "./common.js";
import { test, describe } from "bun:test";
import assert from "node:assert/strict";

describe("non-strict", () => {
  test("handles non-existent viewmodel", async () => {
    const { modified, errors } = await render(
      html`
        <!-- ok with: default from "./does-not-exist.js" -->
        <div data-bind="text: text"></div>
        <!-- /ok -->
      `,
      new URL("__fixtures__/unnamed.html", import.meta.url),
    );
    assert(
      errors.some((error) => error.code === "module-resolution"),
      "Could not find 'module-resolution' error",
    );
    assert(modified);
    assert(modified.includes("><"));
  });

  test.todo("handles invalid binding expression", async () => {
    const text = html`
      <!-- ok with: {} -->
      <div data-bind="text: ???"></div>
      <!-- /ok -->
    `;
    const { modified, errors } = await render(
      text,
      new URL("__fixtures__/unnamed.html", import.meta.url),
    );
    const error = errors.find((error) => error.code === "binding-parse-error");
    assert(error, "Could not find 'binding-parse-error' error");
    assert(
      text.at(error!.range!.start.offset) === "?",
      "Error has invalid start offset",
    );
    assert(
      text.at(error!.range!.end.offset) === "?",
      "Error has invalid end offset",
    );
    assert(modified);
    assert(modified.includes("><"));
  });

  test("handle error when evaluating binding", async () => {
    const { modified, errors } = await render(
      html`
        <!-- ko with: {} -->
        <div data-bind="text: window.foo.bar.baz"></div>
        <!-- /ko -->
      `,
      new URL("__fixtures__/unnamed.html", import.meta.url),
    );
    const error = errors.find(
      (error) => error.code === "binding-evaluation-error",
    );
    assert(error, "Could not find 'binding-evaluation-error' error");
    assert(modified);
    assert(modified.includes("><"));
  });
});
