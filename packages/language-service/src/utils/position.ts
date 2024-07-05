import { Position, Range } from "@knuckles/location";

export interface ProtocolPosition {
  line: number;
  column: number;
}

export function toPosition(position: ProtocolPosition, text: string) {
  return Position.fromLineAndColumn(position.line, position.column, text);
}

export function toProtocolPosition(position: Position): ProtocolPosition {
  return {
    line: position.line,
    column: position.column,
  };
}

export interface ProtocolRange {
  start: ProtocolPosition;
  end: ProtocolPosition;
}

export function toRange(range: ProtocolRange, text: string) {
  return new Range(toPosition(range.start, text), toPosition(range.end, text));
}

export function toProtocolRange(range: Range): ProtocolRange {
  return {
    start: toProtocolPosition(range.start),
    end: toProtocolPosition(range.end),
  };
}

export interface ProtocolLocation {
  path: string;
  range: ProtocolRange;
}
