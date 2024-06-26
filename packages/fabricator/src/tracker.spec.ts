import { Chunk } from "./chunk.js";
import { it, describe, expect } from "@jest/globals";

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
