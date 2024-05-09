import { render } from "../src/lib/exports.js";
import { test, describe } from "bun:test";
import assert from "node:assert/strict";

describe("binding context", () => {
  test("has binding context", async () => {
    const { document } = await render(`
      <!-- #ko with: { exists: true } -->
      <div data-bind="text: $context && $data.exists ? 'yes' : 'no'"></div>
      <!-- /ko -->
    `);
    assert(document);
    assert(document.includes(">yes<"));
  });
});
