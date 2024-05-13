import { Range } from "@knuckles/location";

export interface IdentifierInit {
  range: Range
  value: string;
}

export class Identifier extends Range {
  value: string;

  constructor(init: IdentifierInit) {
    super(init.range.start, init.range.end);
    this.value = init.value;
  }
}

export interface ExpressionInit {
  range: Range
  value: string;
}

export class Expression extends Range {
  value: string;

  constructor(init: ExpressionInit) {
    super(init.range.start, init.range.end);
    this.value = init.value;
  }
}

export interface StringLiteralInit {
  range: Range;
  value: string;
  quote: '"' | "'" | null;
}

export class StringLiteral extends Range {
  value: string;
  quote: '"' | "'" | null;
  
  get text() {
    return this.quote + this.value + this.quote;
  }

  constructor(init: StringLiteralInit) {
    super(init.range.start, init.range.end);
    this.value = init.value;
    this.quote = init.quote;
  }
}