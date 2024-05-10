import type Position from "./position.js";

export function formatFileLocation(
  fileName: string | undefined,
  position: Position,
): string {
  return fileName ? `${fileName}(${position.format()})` : position.format();
}
