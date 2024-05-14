import { html, render } from "./common.js";
import { test, describe } from "bun:test";
import assert from "node:assert/strict";

describe("binding context", () => {
  test("has binding context", async () => {
    const { modified } = await render(html`
      <!-- ko with: { exists: true } -->
      <div data-bind="text: $context && $data.exists ? 'yes' : 'no'"></div>
      <!-- /ko -->
    `);
    assert(modified);
    assert(modified.includes(">yes<"));
  });
});
