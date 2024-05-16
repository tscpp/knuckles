import { Chunk } from "./chunk.js";
import { Range } from "@knuckles/location";
import { describe, it, expect } from "bun:test";

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

  it("adds indentation to appended text", () => {
    const chunk = new Chunk();
    chunk.indent().append("Hello\nWorld");
    expect(chunk.text()).toBe("  Hello\n  World");
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
        .append("Hi ");

      const dynamicMapping = chunk
        .while((chunk) => {
          chunk.append("World");
        })
        .real(Range.zero);

      chunk.insert(3, "Beautiful ");

      const mapping = dynamicMapping.capture();

      expect(mapping.generated.start.offset).toEqual(13);
      expect(mapping.generated.end.offset).toEqual(18);
    });
  });
});
