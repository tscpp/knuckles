import { Chunk } from "./chunk.js";
import { Range } from "@knuckles/location";

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

  it("translates mappings when removing text", () => {
    const chunk = new Chunk() //
      .append("12")
      .append("3344", { mirror: Range.zero })
      .append("56")
      .remove(3, 5);
    const mappings = chunk.mappings();
    expect(mappings.length).toBe(1);
    const mapping = mappings[0]!.capture(chunk.text());
    expect(mapping.generated.start.offset).toBe(2);
    expect(mapping.generated.end.offset).toBe(4);
  });

  it("translates mappings when appending chunk", () => {
    const chunk1 = new Chunk().append("34", { mirror: Range.zero });
    const chunk2 = new Chunk().append("12").append(chunk1);
    const mappings = chunk2.mappings();
    expect(mappings.length).toBe(1);
    const mapping = mappings[0]!.capture(chunk2.text());
    expect(mapping.generated.start.offset).toBe(2);
    expect(mapping.generated.end.offset).toBe(4);
  });

  it("appends chunk array", () => {
    const chunk1 = new Chunk().append("12");
    const chunk2 = new Chunk().append("34");
    const chunk3 = new Chunk().append([chunk1, chunk2]);
    expect(chunk3.text()).toBe("1234");
  });

  it("returns text length", () => {
    const chunk = new Chunk().append("1234");
    expect(chunk.length()).toBe(4);
  });

  it("appends newline", () => {
    const chunk = new Chunk().append("1").newline().append("2");
    expect(chunk.text()).toBe("1\n2");
  });
});
