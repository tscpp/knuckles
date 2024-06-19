import type { Position } from "@knuckles/location";

export class ParserError extends Error {
  constructor(
    readonly start: Position,
    readonly end: Position | undefined,
    readonly description: string,
  ) {
    super(`${start.format()}: ${description}`);
  }
}
