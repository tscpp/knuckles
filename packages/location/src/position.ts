import { detectNewline } from "detect-newline";

export interface RawPosition {
  line: number;
  column: number;
  offset: number;
}

export default class Position {
  static zero = new Position(0, 0, 0);

  static fromOffset(offset: number, text: string): Position {
    const nl = detectNewline(text);

    let line = 0,
      column = 0,
      i = offset;

    if (nl) {
      for (const s of text.split(nl)) {
        if (i - s.length <= 0) {
          column = i;
          i = 0;
          break;
        } else {
          ++line;
          i -= s.length + nl.length;
        }
      }

      if (i > 0) {
        throw new Error(`Offset is out of bounds.`);
      }
    } else {
      column = i;
    }

    return new Position(line, column, offset);
  }

  static fromLineAndColumn(
    line: number,
    column: number,
    text: string,
  ): Position {
    const nl = detectNewline(text);

    let offset = 0;

    if (nl) {
      for (let n = 0; n < line; n++) {
        const index = text.indexOf(nl, offset);
        if (index === -1) {
          throw new Error(`Line is out of bounds.`);
        }
        offset = index + nl.length;
      }
      offset += column;
      if (offset >= text.length) {
        throw new Error(`Column is out of bounds.`);
      }
    } else if (line === 0) {
      offset = column;
    } else {
      throw new Error(`Line is out of bounds.`);
    }

    return new Position(line, column, offset);
  }

  static translate(position: Position, offset: number, text: string): Position {
    return Position.fromOffset(position.offset + offset, text);
  }

  /** zero-indexed */
  public line: number;
  /** zero-indexed */
  public column: number;
  /** zero-indexed */
  public offset: number;

  constructor(line: number, column: number, offset: number);
  constructor(position: Position);
  constructor(...args: [number, number, number] | [Position]) {
    if (args.length === 1) {
      const [position] = args;
      this.line = position.line;
      this.column = position.column;
      this.offset = position.offset;
    } else {
      const [line, column, offset] = args;
      this.line = line;
      this.column = column;
      this.offset = offset;
    }
  }

  format() {
    return `${this.line + 1}:${this.column + 1}`;
  }

  clone() {
    return new Position(this.line, this.column, this.offset);
  }

  copy() {
    return this.clone();
  }

  toJSON(): RawPosition {
    return {
      line: this.line,
      column: this.column,
      offset: this.offset,
    };
  }

  toString() {
    return this.format();
  }
}
