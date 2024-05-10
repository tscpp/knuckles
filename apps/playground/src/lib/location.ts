export type Position = {
  line: number;
  column: number;
  offset: number;
};

export type Range = {
  start: Position;
  end: Position;
};

export type OffsetArray = [start: number, end: number];

export function offsetToPosition(offset: number, text: string) {
  let line = 0,
    column = 0,
    i = offset;

  for (const s of text.split("\n")) {
    if (i - s.length <= 0) {
      column = i;
      i = 0;
      break;
    } else {
      ++line;
      i -= s.length + 1;
    }
  }

  if (i > 0) {
    throw new Error(`Offset is out of bounds.`);
  }

  return { line, column, offset };
}
