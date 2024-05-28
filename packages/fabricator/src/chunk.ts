import { DynamicRange } from "./location.js";
import { DynamicMapping, type Mapping } from "./mapping.js";
import { DynamicMarker, type Marker } from "./marker.js";
import { Tracker } from "./tracker.js";
import { isArray } from "./utils.js";
import type { Range } from "@knuckles/location";

const UNIVERSAL_NEWLINE_REGEX = /\r\n|\n\r|\n|\r/g;

export interface Snapshot {
  original: string;
  generated: string;
  mappings: Mapping[];
  markers: Marker[];
}

/**
 * Represents the changes made to a range of text in a {@link Chunk}.
 */
export interface Change {
  start: number;
  end: number;
  oldText: string;
  newText: string;
}

export type MappingOptions =
  | {
      blame?: Range;
    }
  | {
      mirror?: Range;
    };

export type ChunkLike = string | Chunk | readonly Chunk[];

export interface ChunkOptions {
  /**
   * The string or number of spaces to use for indentation in the chunk.
   */
  indent?: string | number | undefined;

  /**
   * The string to use for newlines in the chunk.
   */
  newline?: string | undefined;

  mapping?: MappingOptions;
}

/**
 * Represents a chunk of text that can be manipulated.
 */
export class Chunk {
  #indent: string;
  #newline: string;
  #indentSize = 0;
  #pendingNewlines = 0;
  #text = "";
  #mappings = new Set<DynamicMapping>();
  #history: Change[] = [];
  #markers = new Set<DynamicMarker>();

  constructor(options?: ChunkOptions) {
    this.#indent =
      typeof options?.indent === "number"
        ? " ".repeat(options.indent)
        : options?.indent ?? "  ";
    this.#newline = options?.newline ?? "\n";
    this.#map(new DynamicRange(this, 0, 0), options?.mapping);
  }

  //#region Public methods

  /**
   * Get the current text content.
   */
  text(): string {
    return this.#text + this.#renderPendingNewlines();
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
    this.#pendingNewlines += count;
    return this;
  }

  /**
   * Increases the current indent size for appended text by one level.
   */
  indent(): this {
    this.#indentSize++;
    return this;
  }

  /**
   * Decreases the current indent size for appended text by one level.
   */
  dedent(): this {
    this.#indentSize--;
    return this;
  }

  /**
   * Appends a chunk or string to the end of the current text content.
   */
  append(chunk: ChunkLike, options?: MappingOptions): this {
    const tracker = this.track();
    this.#write(this.#text.length, chunk);
    this.#mapChanges(tracker.flush(), options);
    return this;
  }

  marker(id: string): this {
    this.#markers.add(
      new DynamicMarker(
        id,
        new DynamicRange(this, this.#text.length, this.#text.length),
      ),
    );
    return this;
  }

  /**
   * Inserts a chunk or string to the right at the specified offset.
   */
  insert(offset: number, chunk: ChunkLike, options?: MappingOptions): this {
    const tracker = this.track();
    this.#write(offset, chunk);
    this.#mapChanges(tracker.flush(), options);
    return this;
  }

  /**
   * Updates the text content by replacing the specified range with the new
   * chunk or string.
   */
  update(start: number, end: number, chunk: ChunkLike): this {
    this.#removeTextAt(start, end);
    this.insert(start, chunk);
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
      end,
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
    return this.#history;
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
    return {
      original,
      generated: this.text(),
      mappings: this.mappings().map((mapping) => mapping.capture()),
      markers: this.markers().map((marker) => marker.capture()),
    };
  }

  //#endregion

  //#region Private methods

  #renderPendingNewlines() {
    const text = (this.#newline + this.#indent.repeat(this.#indentSize)).repeat(
      this.#pendingNewlines,
    );
    this.#pendingNewlines = 0;
    return text;
  }

  #popEmptyLines(lines: string[]): number {
    let emptyLines = 0;

    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i]!.trim() === "") {
        lines.pop();
        emptyLines++;
      } else {
        break;
      }
    }

    return emptyLines;
  }

  #appendText(text: string) {
    const lines = text.split(UNIVERSAL_NEWLINE_REGEX);
    const emptyLines = this.#popEmptyLines(lines);
    if (lines.length > 0) {
      this.#text += this.#renderPendingNewlines();

      const isEmptyLine =
        this.#text.length === 0 || this.#text.charAt(-1) === "\n";
      const text = lines
        .map((line, i) =>
          isEmptyLine || i
            ? this.#indent.repeat(this.#indentSize) + line
            : line,
        )
        .join(this.#newline);

      this.#text += text;
    }
    this.#pendingNewlines += emptyLines;
  }

  #writeTextAt(offset: number, text: string) {
    const before = this.#text;

    if (offset === this.#text.length) {
      this.#appendText(text);
    } else {
      this.#text =
        this.#text.slice(0, offset) + text + this.#text.slice(offset);
    }

    const length = this.#text.length - before.length;
    const oldText = before.slice(offset, offset + length);
    const newText = this.#text.slice(offset, offset + length);

    for (const mapping of this.#mappings) {
      mapping.generated.translate(offset, length);
    }

    this.#history.push({
      start: offset,
      end: offset + length,
      oldText,
      newText,
    });
  }

  #write(offset: number, chunk: ChunkLike) {
    if (isArray(chunk)) {
      for (const child of chunk) {
        this.#write(offset, child);
      }
    } else if (chunk instanceof Chunk) {
      for (const mapping of chunk.#mappings) {
        mapping.generated.translate(0, this.#text.length);
        this.#mappings.add(mapping);
      }

      this.#writeTextAt(offset, chunk.text());
    } else {
      this.#writeTextAt(offset, chunk);
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
    if (!options || !("mirror" in options || "blame" in options)) {
      return;
    }
    const mirror = "mirror" in options;
    const original = ((options as { mirror?: Range }).mirror ??
      (options as { blame?: Range }).blame)!;

    this.#mappings.add(new DynamicMapping(original, generated, mirror));
  }

  #mapChanges(changes: Change[], options?: MappingOptions) {
    if (!options || !("mirror" in options || "blame" in options)) {
      return;
    }

    const ranges = new Set<DynamicRange>();

    for (const change of changes) {
      const touching = new Set<[number, number]>([[change.start, change.end]]);

      for (const range of ranges) {
        const { start, end } = range.captureOffsets();

        if (
          (start >= change.start && start <= change.end) ||
          (end >= change.start && end <= change.end)
        ) {
          touching.add([start, end]);
          ranges.delete(range);
        }
      }

      const start = Array.from(touching)
        .map((v) => v[0])
        .reduce((a, b) => Math.min(a, b));
      const end = Array.from(touching)
        .map((v) => v[1])
        .reduce((a, b) => Math.max(a, b));

      const range = new DynamicRange(this, start, end);
      ranges.add(range);
    }

    for (const range of ranges) {
      this.#map(range, options);
    }
  }

  //#endregion
}
