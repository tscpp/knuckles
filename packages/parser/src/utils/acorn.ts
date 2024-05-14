export interface AcornSyntaxError extends SyntaxError {
  pos: number;
  loc: {
    line: number;
    column: number;
  };
}

export function isAcornSyntaxError(error: any): error is AcornSyntaxError {
  return error instanceof SyntaxError && "pos" in error && "loc" in error;
}
