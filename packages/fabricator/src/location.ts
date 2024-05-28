import type { Chunk } from "./chunk.js";
import { Position, Range } from "@knuckles/location";

export class DynamicPosition {
  #chunk: Chunk;
  #offset: number;

  constructor(chunk: Chunk, offset: number) {
    this.#chunk = chunk;
    this.#offset = offset;
  }

  captureOffset() {
    return this.#offset;
  }

  capture() {
    return Position.fromOffset(this.#offset, this.#chunk.text());
  }

  translate(offset: number, length: number) {
    if (this.#offset >= offset) {
      this.#offset += length;
    }
  }
}

/**
 * Represents a dynamic mapping that automatically updates when the owner
 * {@link Chunk} is modified.
 */
export class DynamicRange {
  readonly start: DynamicPosition;
  readonly end: DynamicPosition;

  /**
   * Use {@link Chunk.while} to create a new instance.
   */
  constructor(chunk: Chunk, start: number, end: number) {
    this.start = new DynamicPosition(chunk, start);
    this.end = new DynamicPosition(chunk, end);
  }

  captureOffsets(): { start: number; end: number } {
    return {
      start: this.start.captureOffset(),
      end: this.end.captureOffset(),
    };
  }

  /**
   * Captures the range based on current state of the owner
   * {@link Chunk}.
   */
  capture(): Range {
    return new Range(this.start.capture(), this.end.capture());
  }

  /**
   * Used by the owner chunk to translate the range when the text content is
   * modified.
   */
  translate(offset: number, length: number) {
    this.start.translate(offset, length);
    this.end.translate(offset, length);
  }
}
