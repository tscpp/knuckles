import { Range, type RawRange } from "@knuckles/location";

export interface IdentifierInit {
  range: Range;
  value: string;
}

export interface RawIdentifier extends RawRange {
  value: string;
}

export class Identifier extends Range {
  value: string;

  constructor(init: IdentifierInit) {
    super(init.range.start, init.range.end);
    this.value = init.value;
  }

  override toJSON(): RawIdentifier {
    return {
      ...super.toJSON(),
      value: this.value,
    };
  }
}

export interface ExpressionInit {
  range: Range;
  value: string;
}

export interface RawExpression extends RawRange {
  value: string;
}

export class Expression extends Range {
  value: string;

  constructor(init: ExpressionInit) {
    super(init.range.start, init.range.end);
    this.value = init.value;
  }

  override toJSON(): RawExpression {
    return {
      ...super.toJSON(),
      value: this.value,
    };
  }
}

export interface StringLiteralInit {
  range: Range;
  inner: Range;
  value: string;
  quote: '"' | "'" | null;
}

export interface RawStringLiteral extends RawRange {
  value: string;
  quote: '"' | "'" | null;
  inner: RawRange;
}

export class StringLiteral extends Range {
  value: string;
  quote: '"' | "'" | null;
  inner: Range;

  get text() {
    return this.quote + this.value + this.quote;
  }

  constructor(init: StringLiteralInit) {
    super(init.range.start, init.range.end);
    this.inner = init.inner;
    this.value = init.value;
    this.quote = init.quote;
  }

  override toJSON(): RawStringLiteral {
    return {
      ...super.toJSON(),
      value: this.value,
      quote: this.quote,
      inner: this.inner.toJSON(),
    };
  }
}
