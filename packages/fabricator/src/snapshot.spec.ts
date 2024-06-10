import { Chunk } from "./chunk.js";
import { type Snapshot } from "./snapshot.js";
import { Position, Range } from "@knuckles/location";

describe("Snapshot", () => {
  let snapshot: Snapshot;

  beforeAll(() => {
    const original = "abcdefghij";

    snapshot = new Chunk()
      .append("(12")
      .while(
        (chunk) =>
          chunk
            .append("34")
            .append("56", {
              mirror: Range.fromOffsets(4, 6, original),
            })
            .append("78"),
        {
          blame: Range.fromOffsets(2, 8, original),
        },
      )
      .append("90)")
      .snapshot(original);
  });

  it("blames generated position to original range", () => {
    const original = snapshot.blame({
      generated: Position.fromOffset(4, snapshot.generated),
    });
    expect(original).not.toBe(null);
    expect(original!.start.offset).toBe(2);
    expect(original!.end.offset).toBe(8);
  });

  it("mirrors generated position to original position", () => {
    const original = snapshot.mirror({
      generated: Position.fromOffset(6, snapshot.generated),
    });
    expect(original).not.toBe(null);
    expect(original!.offset).toBe(5);
  });

  it("mirrors generated range to original range", () => {
    const original = snapshot.mirror({
      generated: Range.fromOffsets(5, 7, snapshot.generated),
    });
    expect(original).not.toBe(null);
    expect(original!.start.offset).toBe(4);
    expect(original!.end.offset).toBe(6);
  });

  it("mirrors original position to generated position", () => {
    const generated = snapshot.mirror({
      original: Position.fromOffset(5, snapshot.original),
    });
    expect(generated).not.toBe(null);
    expect(generated!.offset).toBe(6);
  });

  it("mirrors original range to generated range", () => {
    const generated = snapshot.mirror({
      original: Range.fromOffsets(4, 6, snapshot.original),
    });
    expect(generated).not.toBe(null);
    expect(generated!.start.offset).toBe(5);
    expect(generated!.end.offset).toBe(7);
  });

  it("returns null when unable to blame", () => {
    const original = snapshot.blame({
      generated: Position.fromOffset(2, snapshot.generated),
    });
    expect(original).toBe(null);
  });

  it("blames the smallest range", () => {
    const original = snapshot.blame({
      generated: Position.fromOffset(6, snapshot.generated),
    });
    expect(original).not.toBe(null);
    expect(original!.start.offset).toBe(4);
    expect(original!.end.offset).toBe(6);
  });

  it("returns null when unable to mirror", () => {
    const original = snapshot.mirror({
      generated: Position.fromOffset(2, snapshot.generated),
    });
    expect(original).toBe(null);
  });

  it("mirrors the smallest range", () => {
    const original = "abcdefghij";
    const chunk = new Chunk() //
      .append("12")
      .while(
        (chunk) =>
          chunk
            .append("34")
            .append("56", { mirror: Range.fromOffsets(4, 6, original) })
            .append("78"),
        { mirror: Range.fromOffsets(4, 7, original) },
      );
    const snapshot = chunk.snapshot(original);
    const originalPosition = snapshot.mirror({
      generated: Position.fromOffset(5, snapshot.generated),
    });
    expect(originalPosition).not.toBe(null);
    expect(originalPosition!.offset).toBe(5);
  });

  it("captures markers", () => {
    const chunk = new Chunk() //
      .append("1")
      .marker("middle")
      .append("2");
    const snapshot = chunk.snapshot("foo");
    expect(snapshot.markers.length).toBe(1);
    const marker = snapshot.markers[0]!;
    expect(marker.offset).toBe(1);
  });
});
