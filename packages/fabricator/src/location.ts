// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Chunk } from "./chunk.js";
import { Position, Range } from "@knuckles/location";

export class DynamicPosition {
  #offset: number;

  constructor(offset: number) {
    this.#offset = offset;
  }

  captureOffset() {
    return this.#offset;
  }

  capture(text: string) {
    return Position.fromOffset(this.#offset, text);
  }

  translate(offset: number, length: number) {
    if (this.#offset > offset) {
      this.#offset += length;
    }
  }

  clone(): DynamicPosition {
    return new DynamicPosition(this.#offset);
  }

  copy(): DynamicPosition {
    return this.clone();
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
  constructor(start: number, end: number) {
    this.start = new DynamicPosition(start);
    this.end = new DynamicPosition(end);
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
  capture(text: string): Range {
    return new Range(this.start.capture(text), this.end.capture(text));
  }

  /**
   * Used by the owner chunk to translate the range when the text content is
   * modified.
   */
  translate(offset: number, length: number) {
    this.start.translate(offset, length);
    this.end.translate(offset, length);
  }

  clone(): DynamicRange {
    return new DynamicRange(
      this.start.captureOffset(),
      this.end.captureOffset(),
    );
  }

  copy(): DynamicRange {
    return this.clone();
  }
}
