import { DynamicRange } from "./location.js";
import { DynamicMapping } from "./mapping.js";
import { DynamicMarker } from "./marker.js";
import { Snapshot } from "./snapshot.js";
import { Tracker } from "./tracker.js";
import { isArray } from "./utils.js";
import { type Range } from "@knuckles/location";

/**
 * Represents the changes made to a range of text in a {@link Chunk}.
 */
export interface Change {
  start: number;
  oldText: string;
  newText: string;
}

export type MappingOptions =
  | {
      blame?: Range;
      mirror?: undefined;
    }
  | {
      blame?: undefined;
      mirror?: Range;
    };

export type ChunkLike = string | Chunk | readonly Chunk[];

/**
 * Represents a chunk of text that can be manipulated.
 */
export class Chunk {
  static concat(...chunks: ChunkLike[]): Chunk {
    const parent = new Chunk();
    for (const chunk of chunks.flat()) {
      parent.append(chunk);
    }
    return parent;
  }

  #text = "";
  #mappings = new Set<DynamicMapping>();
  #history: Change[] = [];
  #markers = new Set<DynamicMarker>();

  //#region Public methods

  /**
   * Get the current text content.
   */
  text(): string {
    return this.#text;
  }

  /**
   * Get the current length of the text content. Can be used to get the current
   * offset of the chunk.
   */
  length(): number {
    return this.#text.length;
  }

  /**
   * Appends a newline to the end of the chunk.
   */
  newline(count = 1): this {
    this.append("\n".repeat(count));
    return this;
  }

  /**
   * Appends a chunk or string to the end of the current text content.
   */
  append(chunk: ChunkLike, options?: MappingOptions): this {
    const tracker = this.track();
    this.#write(this.#text.length, this.#text.length, chunk);
    this.#mapChanges(tracker.flush(), options);
    return this;
  }

  if(
    condition: unknown,
    positive: (chunk: this) => void,
    negative?: (chunk: this) => void,
  ) {
    if (condition) {
      positive(this);
    } else {
      negative?.(this);
    }
  }

  marker(id: string): this {
    this.#markers.add(new DynamicMarker(id, this.#text.length));
    return this;
  }

  /**
   * Inserts a chunk or string to the right at the specified offset.
   */
  insert(offset: number, chunk: ChunkLike, options?: MappingOptions): this {
    const tracker = this.track();
    this.#write(offset, offset, chunk);
    this.#mapChanges(tracker.flush(), options);
    return this;
  }

  /**
   * Updates the text content by replacing the specified range with the new
   * chunk or string.
   */
  update(
    start: number,
    end: number,
    chunk: ChunkLike,
    options?: MappingOptions,
  ): this {
    const tracker = this.track();
    this.#write(start, end, chunk);
    this.#mapChanges(tracker.flush(), options);
    return this;
  }

  /**
   * Removes the specified range from the text content.
   */
  remove(start: number, end: number): this {
    const oldText = this.#text.slice(start, end);
    this.#removeTextAt(start, end);

    this.#history.push({
      start,
      oldText,
      newText: "",
    });

    return this;
  }

  while(callback: (chunk: this) => void, options: MappingOptions): this {
    const tracker = this.track();
    callback(this);
    this.#mapChanges(tracker.flush(), options);
    return this;
  }

  /**
   * Creates a new tracker that can be used to get the changes made to the
   * chunk.
   *
   * @see {@link Tracker}
   */
  track(): Tracker {
    return new Tracker(this);
  }

  changes(): Change[] {
    return this.#history.slice();
  }

  mappings(): DynamicMapping[] {
    return Array.from(this.#mappings);
  }

  markers(filter?: string | readonly string[] | undefined): DynamicMarker[] {
    return Array.from(this.#markers).filter((marker) =>
      filter ? (isArray(filter) ? filter : [filter]).includes(marker.id) : true,
    );
  }

  snapshot(original: string): Snapshot {
    return new Snapshot({
      original,
      generated: this.text(),
      mappings: this.mappings().map((mapping) => mapping.capture(this.#text)),
      markers: this.markers().map((marker) => marker.capture(this.#text)),
    });
  }

  clone(): Chunk {
    const chunk = new Chunk();
    chunk.#text = this.#text;
    chunk.#mappings = this.#mappings;
    chunk.#history = this.#history;
    chunk.#markers = this.#markers;
    return chunk;
  }

  copy(): Chunk {
    const chunk = new Chunk();
    chunk.#text = this.#text;
    chunk.#mappings = new Set(
      Array.from(this.#mappings).map((mapping) => mapping.copy()),
    );
    chunk.#history = this.#history.map((change) => ({ ...change }));
    chunk.#markers = new Set(
      Array.from(this.#markers).map((marker) => marker.copy()),
    );
    return chunk;
  }

  //#endregion

  //#region Private methods

  #translate(offset: number, length: number) {
    for (const mapping of this.#mappings) {
      mapping.generated.translate(offset, length);
    }

    for (const marker of this.#markers) {
      marker.translate(offset, length);
    }
  }

  #writeTextAt(start: number, end: number, newText: string) {
    const oldText = this.#text.slice(start, end);
    this.#text = this.#text.slice(0, start) + newText + this.#text.slice(end);
    this.#translate(start, newText.length - oldText.length);
    this.#history.push({
      start,
      oldText,
      newText,
    });
  }

  #write(start: number, end: number, chunk: ChunkLike) {
    if (isArray(chunk)) {
      this.#write(start, end, Chunk.concat(chunk));
    } else if (chunk instanceof Chunk) {
      this.#writeTextAt(start, end, chunk.text());

      for (let mapping of chunk.#mappings) {
        mapping = mapping.copy();
        mapping.generated.translate(-1, start);
        this.#mappings.add(mapping);
      }

      for (let marker of chunk.#markers) {
        marker = marker.copy();
        marker.translate(-1, start);
        this.#markers.add(marker);
      }
    } else {
      this.#writeTextAt(start, end, chunk);
    }
  }

  #removeTextAt(start: number, end: number) {
    this.#text = this.#text.slice(0, start) + this.#text.slice(end);
    const length = end - start;

    for (const range of this.#mappings.values()) {
      range.generated.translate(start, -length);
    }
  }

  #map(generated: DynamicRange, options?: MappingOptions) {
    if (!(options?.blame || options?.mirror)) {
      return;
    }
    const mirror = "mirror" in options;
    const original = ((options as { mirror?: Range }).mirror ??
      (options as { blame?: Range }).blame)!;

    this.#mappings.add(new DynamicMapping(original, generated, mirror));
  }

  #mapChanges(changes: Change[], options?: MappingOptions) {
    if (!(options?.blame || options?.mirror)) {
      return;
    }

    const ranges = new Set<DynamicRange>();

    for (const change of changes) {
      const changeStart = change.start;
      const changeEnd = changeStart + change.newText.length;
      const touching = new Set<[number, number]>([[changeStart, changeEnd]]);

      for (const range of ranges) {
        const { start, end } = range.captureOffsets();

        if (
          (start >= changeStart && start <= changeEnd) ||
          (end >= changeStart && end <= changeEnd)
        ) {
          touching.add([start, end]);
          ranges.delete(range);
        }
      }

      const rangeStart = Array.from(touching)
        .map((v) => v[0])
        .reduce((a, b) => Math.min(a, b));
      const rangeEnd = Array.from(touching)
        .map((v) => v[1])
        .reduce((a, b) => Math.max(a, b));

      const range = new DynamicRange(rangeStart, rangeEnd);
      ranges.add(range);
    }

    for (const range of ranges) {
      this.#map(range, options);
    }
  }

  //#endregion
}
