import type { Range } from "@knuckles/location";

export class ParserError extends Error {
  constructor(
    readonly range: Range,
    readonly description: string,
  ) {
    super(`${range.start.format()}: ${description}`);
  }
}
