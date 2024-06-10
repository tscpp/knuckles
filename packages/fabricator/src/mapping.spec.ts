import { Chunk } from "./chunk.js";
import { Range } from "@knuckles/location";
import assert from "node:assert/strict";

describe("DynamicMapping", () => {
  it("maps changes", () => {
    const chunk = new Chunk() //
      .append("Hi ")
      .while((chunk) => chunk.append("World"), { mirror: Range.zero })
      .insert(4, "Beautiful ");

    const mapping = chunk.mappings()[0]?.capture(chunk.text());
    assert(mapping);

    expect(mapping.generated.start.offset).toEqual(3);
    expect(mapping.generated.end.offset).toEqual(18);
  });
});
