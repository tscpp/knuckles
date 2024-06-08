import knockoutSSR from "../src/rollup/plugin.js";
import assert from "node:assert/strict";
import { rollup } from "rollup";

describe("rollup (build-tool)", () => {
  test("build", async () => {
    const build = await rollup({
      input: "test/__fixtures__/view.html",
      plugins: [
        knockoutSSR({
          fallback: true,
        }),
      ],
    });

    const { output } = await build.generate({
      format: "esm",
    });
    const [chunk] = output;

    assert(
      chunk.code.includes("SSR"),
      "generated chunk is missing rendered text",
    );
  });
});
