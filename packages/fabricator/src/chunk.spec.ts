import { Chunk } from "./chunk.js";
import { Range } from "@knuckles/location";
import { describe, it, expect } from "bun:test";
import assert from "node:assert/strict";

describe("Chunk", () => {
  it("appends text", () => {
    const chunk = new Chunk();
    chunk.append("Hello");
    chunk.append("World");
    expect(chunk.text()).toBe("HelloWorld");
  });

  it("inserts text", () => {
    const chunk = new Chunk();
    chunk.append("Hello");
    chunk.insert(5, " World");
    expect(chunk.text()).toBe("Hello World");
  });

  it("updates text", () => {
    const chunk = new Chunk();
    chunk.append("Hello");
    chunk.update(0, 5, "Hi");
    expect(chunk.text()).toBe("Hi");
  });

  it("removes text", () => {
    const chunk = new Chunk();
    chunk.append("Hello");
    chunk.remove(0, 5);
    expect(chunk.text()).toBe("");
  });

  describe("Tracker", () => {
    it("tracks changes", () => {
      const chunk = new Chunk();
      const tracker = chunk.track();

      chunk.append("Hello");
      chunk.insert(5, " World");
      chunk.update(0, 5, "Hi");
      chunk.remove(0, 2);

      const changes = tracker.flush();
      expect(changes).toMatchSnapshot();
    });
  });

  describe("DynamicMapping", () => {
    it("maps changes", () => {
      const chunk = new Chunk() //
        .append("Hi ")
        .while((chunk) => chunk.append("World"), { mirror: Range.zero })
        .insert(3, "Beautiful ");

      const mapping = chunk.mappings()[0]?.capture(chunk.text());
      assert(mapping);

      expect(mapping.generated.start.offset).toEqual(13);
      expect(mapping.generated.end.offset).toEqual(18);
    });
  });
});
