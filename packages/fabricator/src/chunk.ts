import { Range } from "@knuckles/location";

const UNIVERSAL_NEWLINE_REGEX = /\r\n|\n\r|\n|\r/g;

export interface OffsetMapping {
  original: OffsetRange;
  generated: OffsetRange | undefined;
  uniform: boolean;
  name: string | undefined;
}

export interface Mapping {
  original: Range;
  generated: Range;
  uniform: boolean;
  name: string | undefined;
}

export interface MappingOptions {
  range?: OffsetRange | Range;
  bidirectional?: boolean;
  name?: string;
}

export interface OffsetRange {
  start: number;
  end: number;
}

export interface ChunkOptions {
  indent?: string | number | undefined;
  eol?: string | undefined;
  mapping?: MappingOptions;
}

function toOffsetRange(range: OffsetRange | Range): OffsetRange {
  return range instanceof Range
    ? { start: range.start.offset, end: range.end.offset }
    : range;
}

export class Chunk {
  #content = "";
  #mappings: OffsetMapping[] = [];
  #locators = new Map<string, OffsetRange[]>();
  #indentCount = 0;
  #eol: string;
  #indent: string;

  constructor(options?: ChunkOptions) {
    this.#eol = options?.eol ?? "\n";
    this.#indent =
      typeof options?.indent === "number"
        ? " ".repeat(options.indent)
        : options?.indent ?? "  ";
    if (options?.mapping?.range) {
      this.#mappings.push({
        generated: undefined,
        original: toOffsetRange(options.mapping.range),
        uniform: options.mapping.bidirectional ?? false,
        name: options.mapping.name,
      });
    }
  }

  /**
   * Source content as text.
   */
  get content(): string {
    return this.#content;
  }

  /**
   * The current offset.
   */
  get length() {
    return this.content.length;
  }

  /**
   * Clones the chunk. Used to avoid mutating the original chunk.
   *
   * @returns The cloned chunk.
   */
  clone(): Chunk {
    const chunk = new Chunk();
    chunk.#content = this.#content;
    chunk.#mappings = this.#mappings;
    chunk.#locators = this.#locators;
    chunk.#indentCount = this.#indentCount;
    chunk.#indent = this.#eol;
    chunk.#indent = this.#indent;
    return chunk;
  }

  /**
   * Writes content to the current offset.
   *
   * @param content The new content.
   */
  write(content: string, mapping?: MappingOptions): this {
    const generatedStart = this.length;

    const indent = this.#indent.repeat(this.#indentCount);

    if (this.#content.endsWith("\n")) {
      this.#content += indent;
    }

    const lines = content.split(UNIVERSAL_NEWLINE_REGEX);
    this.#content += lines.shift();
    this.#content += lines
      .map((line) => (line.trim() === "" ? "\n" : "\n" + indent + line))
      .join("");

    if (mapping?.range) {
      this.#mappings.push({
        generated: {
          start: generatedStart,
          end: this.length,
        },
        original: toOffsetRange(mapping.range),
        uniform: mapping.bidirectional ?? false,
        name: mapping.name,
      });
    }

    return this;
  }

  #occurrences(locator: string): OffsetRange[] {
    let occurrences = this.#locators.get(locator);
    if (!occurrences) {
      this.#locators.set(locator, (occurrences = []));
    }
    return occurrences;
  }

  /**
   * Finds all the occurances of the locators added using {@link locator}.
   *
   * @param locator The identifier of the locator. Same as passed to {@link locator}.
   */
  occurrences(
    ...locators: (string | readonly string[])[]
  ): Iterable<OffsetRange> {
    return {
      [Symbol.iterator]: () => {
        let i = 0;

        return {
          next: () => {
            const occurrences = locators
              .flat()
              .flatMap((locator) => this.#occurrences(locator));

            if (i < occurrences.length) {
              return { done: false, value: occurrences[i++]! };
            } else {
              return { done: true, value: undefined };
            }
          },
        };
      },
    };
  }

  /**
   * Adds a locator in the chunk. The occurances of the locator is stored in
   * the chunk and can be accessed using {@link occurances}.
   *
   * @param name The identifier of the locator.
   */
  locate(name: string, callback: (chunk: this) => void): this {
    const start = this.length;
    callback(this);
    const end = this.length;
    this.#occurrences(name).push({ start, end });
    return this;
  }

  /**
   * Adds newline(s) (by default 1) at the current offset.
   *
   * @param count The number of newlines to add.
   */
  nl(count = 1) {
    this.#content += "\n".repeat(count);
    return this;
  }

  /**
   * Increases indentation by the specificed offset (by default 1).
   *
   * @param offset The offset to apply to the indentation.
   * @returns
   */
  indent(offset = 1) {
    this.#indentCount = Math.max(this.#indentCount + offset, 0);
    return this;
  }

  /**
   * Decreases indentation by the specificed offset (by default 1). Opposite of
   * {@link indent}.
   *
   * @param offset The negated offset to apply to the indentation.
   */
  dedent(offset = 1): this {
    this.indent(-offset);
    return this;
  }

  /**
   * Inserts content at a specific offset in the chunk, and {@link translate}s
   * the positions accordingly.
   *
   * @param offset The offset of where to insert the new content.
   * @param string The new content to insert.
   */
  insert(offset: number, string: string) {
    this.translate(offset, string.length);

    this.#content =
      this.#content.slice(0, offset) + string + this.#content.slice(offset);

    return this;
  }

  /**
   * Translates the chunk's positions (mappings and locators) by a certain length.
   *
   * @param offset From where to translate. Everything below this offset is untouched.
   * @param length The length to translate the positions with.
   */
  translate(offset: number, length: number) {
    // Translate mappings.
    for (const mapping of this.#mappings) {
      if (!mapping.generated) continue;

      if (mapping.generated.start >= offset) {
        mapping.generated.start += length;
      }

      if (mapping.generated.end >= offset) {
        mapping.generated.end += length;
      }
    }

    // Translate locators.
    for (const occurrences of this.#locators.values()) {
      for (let i = 0; i < occurrences.length; ++i) {
        if (occurrences[i]!.start >= offset) {
          occurrences[i]!.start += length;
          occurrences[i]!.end += length;
        } else if (occurrences[i]!.end >= offset) {
          occurrences[i]!.end += length;
        }
      }
    }

    return this;
  }

  /**
   * Adds chunk(s) to the current offset. Content is {@link translate}d accordingly.
   *
   * @param chunks
   * @returns
   */
  add(...chunks: (Chunk | readonly Chunk[])[]): this {
    for (let chunk of chunks.flat()) {
      // Copy chunk to avoid mutating the original.
      chunk = chunk.clone();

      // Indent all content in chunk.
      let offset = 0,
        first = true;
      for (const line of chunk.content.split(UNIVERSAL_NEWLINE_REGEX)) {
        const indent = this.#indent.repeat(this.#indentCount);
        if (!first) {
          chunk.insert(offset, indent);
          first = false;
        }
        offset += indent.length + line.length + 1;
      }

      // Translate everything in chunk to current offset.
      chunk.translate(0, this.length);

      // Copy mappings.
      this.#mappings.push(
        ...chunk.#mappings.map((mapping) => ({
          ...mapping,
          generated: mapping.generated ?? {
            start: this.length,
            end: this.length + chunk.length,
          },
        })),
      );

      // Copy locators.
      for (const [locator, occurrences] of chunk.#locators) {
        this.#occurrences(locator).push(...occurrences);
      }

      // Push content.
      this.#content += chunk.#content;
    }

    return this;
  }

  getMappings(original: string): Mapping[] {
    return this.#mappings.map(
      (mapping): Mapping => ({
        ...mapping,
        generated: Range.fromOffset(
          mapping.generated?.start ?? 0,
          mapping.generated?.end ?? this.length,
          this.#content,
        ),
        original: Range.fromOffset(
          mapping.original.start,
          mapping.original.end,
          original,
        ),
      }),
    );
  }
}
