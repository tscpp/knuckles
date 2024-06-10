import { Chunk } from "./chunk.js";

describe("Marker", () => {
  it("remembers marker position", () => {
    const chunk = new Chunk() //
      .append("12")
      .marker("middle")
      .append("34");
    const markers = chunk.markers("middle");
    expect(markers.length).toBe(1);
    const marker = markers[0]!;
    expect(marker.captureOffset()).toBe(2);
  });

  it.failing("translates marker position when content is inserted", () => {
    const chunk = new Chunk()
      .append("12")
      .marker("middle")
      .append("456")
      .insert(2, "3");
    const markers = chunk.markers("middle");
    expect(markers.length).toBe(1);
    const marker = markers[0]!;
    expect(marker.captureOffset()).toBe(3);
  });

  it("translates marker position when appended to another chunk", () => {
    const chunk1 = new Chunk() //
      .append("34")
      .marker("middle")
      .append("56");
    const chunk2 = new Chunk() //
      .append("12")
      .append(chunk1)
      .append("78");
    const markers = chunk2.markers("middle");
    expect(markers.length).toBe(1);
    const marker = markers[0]!;
    expect(marker.captureOffset()).toBe(4);
  });

  it("captures position with line and column", () => {
    const chunk = new Chunk() //
      .append("1\n2")
      .marker("middle")
      .append("3\n4");
    const markers = chunk.markers("middle");
    expect(markers.length).toBe(1);
    const marker = markers[0]!;
    const position = marker.capture(chunk.text());
    expect(position.line).toBe(1);
    expect(position.column).toBe(1);
  });
});
