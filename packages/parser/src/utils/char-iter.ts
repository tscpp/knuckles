import { ParserError } from "../error.js";
import { Range } from "@knuckles/location";

export default class CharIter {
  #index: number;
  #char: string;

  readonly chars: readonly string[];

  constructor(
    readonly string: string,
    offset = 0,
  ) {
    if (offset < 0 || offset >= string.length) {
      throw new Error("Invalid offset.");
    }

    this.chars = Array.from(string);
    this.#index = offset;
    this.#char = this.chars[this.#index]!;
  }

  char() {
    return this.#char;
  }

  index() {
    return this.#index;
  }

  next() {
    if (this.#index >= this.chars.length - 1) {
      throw new ParserError(
        Range.fromOffset(this.#index, this.#index + 1, this.string),
        "Unexpected end of input.",
      );
    } else {
      return (this.#char = this.chars[++this.#index]!);
    }
  }

  peek() {
    if (this.#index >= this.chars.length - 1) {
      return null;
    } else {
      return this.chars[this.#index + 1];
    }
  }

  expect(string: string) {
    const start = this.#index;
    const chars = Array.from(string);
    for (const char of chars) {
      if (this.char() !== char) {
        throw new ParserError(
          Range.fromOffset(start, start + string.length, this.string),
          `Expected "${string}".`,
        );
      }
      this.next();
    }
  }
}
