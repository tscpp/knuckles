import Position from "./position.js";

export default class Range {
  static zero = new Range(0, 0, 0, 0, 0, 0);

  static fromOffsets(start: number, end: number, text: string): Range {
    return new Range(
      Position.fromOffset(start, text),
      Position.fromOffset(end, text),
    );
  }

  static fromLinesAndColumns(
    startLine: number,
    startColumn: number,
    endLine: number,
    endColumn: number,
    text: string,
  ): Range {
    return new Range(
      Position.fromLineAndColumn(startLine, startColumn, text),
      Position.fromLineAndColumn(endLine, endColumn, text),
    );
  }

  static translate(range: Range, offset: number, text: string) {
    return new Range(
      Position.translate(range.start, offset, text),
      Position.translate(range.end, offset, text),
    );
  }

  readonly start: Position;
  readonly end: Position;

  constructor(range: Range);
  constructor(start: Position, end: Position);
  constructor(
    startLine: number,
    startColumn: number,
    startOffset: number,
    endLine: number,
    endColumn: number,
    endOffset: number,
  );
  constructor(
    ...args:
      | [Range]
      | [Position, Position]
      | [number, number, number, number, number, number]
  ) {
    if (args.length === 1) {
      const [range] = args;
      this.start = range.start;
      this.end = range.end;
    } else if (args.length === 2) {
      this.start = args[0];
      this.end = args[1];
    } else {
      this.start = new Position(args[0], args[1], args[2]);
      this.end = new Position(args[3], args[4], args[5]);
    }
  }

  get size() {
    return this.end.offset - this.start.offset;
  }

  get offsets(): readonly [number, number] {
    return [this.start.offset, this.end.offset];
  }

  get isEmpty(): boolean {
    return this.start.offset === this.end.offset;
  }

  clone() {
    return new Range(this);
  }

  copy() {
    return new Range(
      this.start.line,
      this.start.column,
      this.start.offset,
      this.end.line,
      this.end.column,
      this.end.offset,
    );
  }

  contains(locator: Position | Range): boolean {
    if (locator instanceof Range) {
      return this.contains(locator.start) && this.contains(locator.end);
    } else {
      return (
        this.start.offset <= locator.offset && locator.offset <= this.end.offset
      );
    }
  }
}
