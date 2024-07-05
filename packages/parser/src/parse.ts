import type { ParserError } from "./error.js";
import type { ParserOptions } from "./parser.js";
import Parser from "./parser.js";
import type { SyntaxTree } from "@knuckles/syntax-tree";

export interface ParseOptions extends ParserOptions {}

export type ParseResult = {
  document: SyntaxTree | null;
  errors: ParserError[];
};

export function parse(string: string, options?: ParseOptions): ParseResult {
  const parser = new Parser(string, options);
  const document = parser.parse();
  const errors = parser.errors;
  return {
    document,
    errors,
  };
}
