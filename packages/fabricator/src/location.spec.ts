import { DynamicPosition, DynamicRange } from "./location.js";

describe("DynamicPosition", () => {
  it("translates position", () => {
    const dynamicPosition = new DynamicPosition(5);
    dynamicPosition.translate(3, 2);
    const offset = dynamicPosition.captureOffset();
    expect(offset).toBe(7);
  });

  it("ignores translation when unaffected", () => {
    const dynamicPosition = new DynamicPosition(5);
    dynamicPosition.translate(7, 2);
    const offset = dynamicPosition.captureOffset();
    expect(offset).toBe(5);
  });
});

describe("DynamicRange", () => {
  it("translates range", () => {
    const dynamicRange = new DynamicRange(5, 10);
    dynamicRange.translate(2, 5);
    const { start, end } = dynamicRange.captureOffsets();
    expect(start).toBe(10);
    expect(end).toBe(15);
  });

  it("resizes the range when offset is within the range", () => {
    const dynamicRange = new DynamicRange(5, 10);
    dynamicRange.translate(7, 5);
    const { start, end } = dynamicRange.captureOffsets();
    expect(start).toBe(5);
    expect(end).toBe(15);
  });

  it("ignores translation when unaffected", () => {
    const dynamicRange = new DynamicRange(5, 10);
    dynamicRange.translate(15, 5);
    const { start, end } = dynamicRange.captureOffsets();
    expect(start).toBe(5);
    expect(end).toBe(10);
  });
});
