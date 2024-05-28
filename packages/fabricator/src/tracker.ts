import type { Change, Chunk } from "./chunk.js";

/**
 * Tracks the changes made to a {@link Chunk} instance.
 */
export class Tracker {
  #chunk: Chunk;
  #dismissed: Change[];

  /**
   * Use {@link Chunk.track} to create a new instance.
   */
  constructor(chunk: Chunk) {
    this.#chunk = chunk;
    this.#dismissed = chunk.changes();
  }

  /**
   * Gets the new changes made to the owner {@link Chunk} since the last flush.
   */
  peek() {
    return this.#chunk
      .changes()
      .filter((change) => !this.#dismissed.includes(change));
  }

  /**
   * Gets the changes made to the owner {@link Chunk} since the last flush and
   * clears the new changes.
   */
  flush() {
    const changes = this.peek();
    this.#dismissed.push(...changes);
    return changes;
  }
}
