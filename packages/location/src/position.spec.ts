import Position from "./position.js";

describe("Position", () => {
  it("Converts offset to position using LF", () => {
    const position = Position.fromOffset(5, "foo\nbar\n");
    expect(position).toMatchObject({
      line: 1,
      column: 1,
    });
  });

  it("Converts offset to position using CRLF", () => {
    const position = Position.fromOffset(6, "foo\r\nbar\r\n");
    expect(position).toMatchObject({
      line: 1,
      column: 1,
    });
  });

  it("Converts offset to position at last column", () => {
    const position = Position.fromOffset(4, "text\ntext");
    expect(position).toMatchObject({
      line: 0,
      column: 4,
    });
  });

  it("Converts line and column to position using LF", () => {
    const position = Position.fromLineAndColumn(1, 1, "foo\nbar\n");
    expect(position).toMatchObject({
      offset: 5,
    });
  });

  it("Converts line and column to position using CRLF", () => {
    const position = Position.fromLineAndColumn(1, 1, "foo\r\nbar\r\n");
    expect(position).toMatchObject({
      offset: 6,
    });
  });

  it("Converts offset in middle of CRLF to line and column", () => {
    const position = Position.fromOffset(9, "foo\r\nbar\r\n");
    expect(position).toMatchObject({
      line: 2,
      column: 0,
    });
  });
});
