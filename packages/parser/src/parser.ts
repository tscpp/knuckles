import { ParserError } from "./error.js";
import { isAcornSyntaxError } from "./utils/acorn.js";
import CharIter from "./utils/char-iter.js";
import {
  parse5ErrorMessage,
  isParse5CommentNode,
  isParse5Element,
  isParse5TextNode,
  parse5 as p5,
  parse5LocationToRange,
  parse5NodeToRange,
  type parse5TreeAdapter as p5t,
} from "./utils/parse5.js";
import { Range, Position } from "@knuckles/location";
import {
  SyntaxTree,
  type Node,
  Text,
  Comment,
  Element,
  Attribute,
  Binding,
  VirtualElement,
  Identifier,
  Expression,
  KoVirtualElement,
  OkVirtualElement,
  ImportStatement,
  StringLiteral,
} from "@knuckles/syntax-tree";
import * as acorn from "acorn";
import * as acornLoose from "acorn-loose";

export const VIRTUAL_ELEMENT_START_REGEX = //
  /^(\s*)(ko|ok)(\s+)([^]*?)\s*$/;

export interface ParserOptions {
  bindingAttributes?: readonly string[];
}

export default class Parser {
  readonly #string: string;
  readonly #options: ParserOptions;

  readonly errors: ParserError[] = [];

  constructor(string: string, options?: ParserOptions | undefined) {
    this.#string = string;
    this.#options = options ?? {};
  }

  //#region Utils
  #error(range: Range, description: string): ParserError;
  #error(start: Position, description: string): ParserError;
  #error(location: Range | Position, description: string): ParserError {
    const start = location instanceof Range ? location.start : location;
    const end = location instanceof Range ? location.end : undefined;
    const error = new ParserError(start, end, description);
    this.errors.push(error);
    return error;
  }

  #range(start: number, end: number) {
    return Range.fromOffsets(start, end, this.#string);
  }
  //#endregion

  //#region Document
  parse(): SyntaxTree | null {
    const fragment = p5.parseFragment(this.#string, {
      sourceCodeLocationInfo: true,
      scriptingEnabled: false,
      onParseError: (error) => {
        const description = parse5ErrorMessage(error);
        this.errors.push(
          this.#error(parse5LocationToRange(error), description),
        );
      },
    });

    try {
      const document = this.#parseDocument(fragment);
      return document;
    } catch (error) {
      if (error instanceof ParserError) {
        this.errors.push(error);
        return null;
      } else {
        throw error;
      }
    }
  }

  #parseDocument(fragment: p5t.DocumentFragment): SyntaxTree {
    const iter = fragment.childNodes[Symbol.iterator]();
    const children: Node[] = [];
    let result: IteratorResult<p5t.Node> | undefined;

    while (!(result = iter.next()).done) {
      children.push(this.#parseNode(result.value, iter));
    }

    return new SyntaxTree({
      children,
      range: new Range(
        Position.zero,
        Position.fromOffset(this.#string.length, this.#string),
      ),
    });
  }

  #parseNode(node: p5t.Node, iter: Iterator<p5t.Node>): Node {
    switch (true) {
      case isParse5TextNode(node): {
        return new Text({
          content: node.value,
          range: parse5NodeToRange(node),
        });
      }
      case isParse5CommentNode(node): {
        if (VIRTUAL_ELEMENT_START_REGEX.test(node.data)) {
          return this.#parseVirtualElement(node, iter);
        } else {
          return new Comment({
            content: node.data,
            range: parse5NodeToRange(node),
          });
        }
      }
      case isParse5Element(node): {
        return this.#parseElement(node);
      }
      default: {
        throw new Error("Unexpected node type");
      }
    }
  }
  //#endregion

  //#region Virtual element
  #parseVirtualElement(
    node: p5t.CommentNode,
    iter: Iterator<p5t.Node>,
  ): VirtualElement {
    const [padding1, nsText, padding3, expressionText] =
      VIRTUAL_ELEMENT_START_REGEX.exec(node.data)!.slice(1) as [
        string,
        string,
        string,
        string,
      ];

    const startComment = new Comment({
      content: node.data,
      range: parse5NodeToRange(node),
    });

    const children: Node[] = [];
    let endComment: Comment | undefined;

    const endCommentRegex = new RegExp(`^\\s*\\/${nsText}(\\s|$)`);

    let result: IteratorResult<p5t.Node> | undefined;
    while (!(result = iter.next()).done) {
      const childNode = result.value;

      if (isParse5CommentNode(childNode)) {
        if (endCommentRegex.test(childNode.data)) {
          endComment = new Comment({
            content: childNode.data,
            range: parse5NodeToRange(childNode),
          });
          break;
        }
      }

      children.push(this.#parseNode(childNode, iter) as Node);
    }

    if (!endComment) {
      throw this.#error(startComment, `Missing end comment.`);
    }

    const dataOffset = node.sourceCodeLocation!.startOffset + "<!--".length;
    const nsOffset = dataOffset + padding1.length;
    const expressionOffset = nsOffset + nsText.length + padding3.length;

    const namespace = new Identifier({
      value: nsText,
      range: Range.fromOffsets(
        nsOffset,
        nsOffset + nsText.length,
        this.#string,
      ),
    });

    const expression = new Expression({
      range: new Range(
        Position.fromOffset(expressionOffset, this.#string),
        Position.fromOffset(
          expressionOffset + expressionText.length,
          this.#string,
        ),
      ),
      value: expressionText,
    });

    if (namespace.value === "ko") {
      const node = new KoVirtualElement({
        namespace,
        expression,
        bindings: [],
        startComment,
        children,
        endComment,
        range: new Range(startComment.start, endComment.end),
      });
      node.bindings = this.#parseBindings(expression, node);
      return node;
    }

    if (namespace.value === "ok") {
      const match = /([^\s]+)(\s*:\s*)([^]*?)/.exec(expression.value);
      if (!match) {
        throw this.#error(
          expression,
          "Expected an identifier followed by ':'.",
        );
      }
      const [nameText, padding2, paramText] = match.slice(1) as [
        string,
        string,
        string,
      ];

      const name = new Identifier({
        value: nameText,
        range: new Range(
          expression.start,
          Position.fromOffset(expressionOffset + nameText.length, this.#string),
        ),
      });

      const param = new Identifier({
        value: paramText,
        range: new Range(
          Position.fromOffset(
            expressionOffset + nameText.length + padding2.length,
            this.#string,
          ),
          expression.end,
        ),
      });

      let importStatement: ImportStatement | undefined;
      if (nameText === "with" || nameText === "using") {
        importStatement = this.#parseImportStatement(
          new CharIter(
            this.#string,
            expressionOffset + nameText.length + padding2.length,
          ),
        );
      }

      return new OkVirtualElement({
        name,
        param,
        namespace,
        expression,
        import: importStatement,
        startComment,
        children,
        endComment,
        range: new Range(startComment.start, endComment.end),
      });
    }

    return new VirtualElement({
      namespace,
      expression,
      startComment,
      children,
      endComment,
      range: new Range(startComment.start, endComment.end),
    });
  }

  #parseImportStatement(iter: CharIter): ImportStatement {
    const start = iter.index();

    let isTypeOnly = false;

    let identifier: Identifier;

    if (iter.char() === "*") {
      iter.next();
      identifier = new Identifier({
        value: "*",
        range: this.#range(start, iter.index()),
      });
    } else if (this.#isIdentifier(iter)) {
      identifier = this.#parseIdentifier(iter);
    } else {
      throw this.#error(
        this.#range(start, iter.index()),
        "Expected identifier or '*'.",
      );
    }

    this.#parseWhitespace(iter);

    if (identifier.value === "type" && this.#isIdentifier(iter)) {
      isTypeOnly = true;
      identifier = this.#parseIdentifier(iter);
    }

    if (this.#isWhitespace(iter)) {
      this.#parseWhitespace(iter);
    }

    iter.expect("from");

    this.#parseWhitespace(iter);

    const module = this.#parseStringLiteral(iter);

    return new ImportStatement({
      range: this.#range(start, iter.index()),
      isTypeOnly,
      identifier,
      module,
    });
  }
  //#endregion

  //#region Element
  #parseElement(node: p5t.Element) {
    const iter = node.childNodes[Symbol.iterator]();
    const children: Node[] = [];
    let current: IteratorResult<p5t.Node> | undefined;

    while (!(current = iter.next()).done) {
      children.push(this.#parseNode(current.value, iter));
    }

    const range = parse5NodeToRange(node);

    const tagName = new Identifier({
      value: node.tagName,
      range: Range.fromOffsets(
        range.start.offset + 1,
        range.start.offset + 1 + node.tagName.length,
        this.#string,
      ),
    });

    const element = new Element({
      tagName,
      attributes: [],
      bindings: [],
      children,
      range,
      inner: undefined!,
    });

    const attributes = node.attrs.map((attr) =>
      this.#parseAttribute(element, node, attr),
    );

    const bindings = attributes
      .filter((attr) =>
        (this.#options.bindingAttributes ?? ["data-bind"]).includes(
          attr.name.value,
        ),
      )
      .flatMap((attr) => {
        const expression = new Expression({
          value: attr.value.value,
          range: attr.value.inner,
        });

        return this.#parseBindings(expression, element);
      });

    let inner: Range;
    if (children.length > 0) {
      inner = new Range(children[0]!.start, children.at(-1)!.end);
    } else {
      let i = attributes
        .map((attribute) => attribute.end.offset)
        .reduce((a, b) => Math.max(a, b), 0);
      while (this.#string.charAt(i) !== ">" && i < this.#string.length) {
        ++i;
      }
      ++i;
      const pos = Position.fromOffset(i, this.#string);
      inner = new Range(pos, pos);
    }

    element.attributes = attributes;
    element.bindings = bindings;
    element.inner = inner;

    return element;
  }

  #parseAttribute(
    parent: Element,
    node: p5t.Element,
    attr: p5.Token.Attribute,
  ) {
    const firstChar = this.#string.at(
      node.sourceCodeLocation!.attrs![attr.name]!.startOffset +
        attr.name.length +
        1,
    );
    const quoted = (["'", '"'] as unknown[]).includes(firstChar);
    const quote = quoted ? (firstChar as '"' | "'") : null;

    const range = parse5LocationToRange(
      node.sourceCodeLocation!.attrs![attr.name]!,
    );
    const valueRange = new Range(
      Position.fromOffset(
        range.start.offset +
          // name
          attr.name.length +
          // equal
          1,
        this.#string,
      ),
      range.end,
    );
    const valueInnerRange = quoted
      ? new Range(
          Position.fromOffset(valueRange.start.offset + 1, this.#string),
          Position.fromOffset(valueRange.end.offset - 1, this.#string),
        )
      : valueRange;

    return new Attribute({
      name: new Identifier({
        value: attr.name,
        range: new Range(
          range.start,
          Position.fromOffset(
            range.start.offset + attr.name.length,
            this.#string,
          ),
        ),
      }),
      value: new StringLiteral({
        // parse5 replaces all occurrences of CRLF with LF, which breaks mappings.
        value: this.#string.slice(
          valueInnerRange.start.offset,
          valueInnerRange.end.offset,
        ),
        inner: valueInnerRange,
        quote,
        range: valueRange,
      }),
      namespace: attr.namespace,
      prefix: attr.prefix,
      range,
      parent,
    });
  }
  //#endregion

  //#region Bindings
  #parseBindings(node: Expression, parent: Element | KoVirtualElement) {
    const translate = (offset: number) =>
      node.start.offset +
      offset -
      // wrapping characters
      2;

    const acornOptions: acorn.Options = {
      ecmaVersion: "latest",
      sourceType: "script",
      ranges: true,
    };

    const expressionText = `({${node.value}})`;
    let expression: acorn.Expression | undefined;
    try {
      expression = acorn.parseExpressionAt(expressionText, 0, acornOptions);
    } catch (error) {
      if (isAcornSyntaxError(error)) {
        let program: acorn.Program;

        try {
          program = acornLoose.parse(expressionText, acornOptions);
        } catch (error) {
          if (isAcornSyntaxError(error)) {
            this.#error(
              Range.fromOffsets(
                translate(error.pos),
                translate(error.pos + 1),
                this.#string,
              ),
              error.message,
            );
            return [];
          } else {
            throw error;
          }
        }

        const statement = program.body[0];
        if (statement?.type === "ExpressionStatement") {
          expression = statement.expression;
        }

        this.#error(
          Range.fromOffsets(
            translate(error.pos),
            translate(error.pos + 1),
            this.#string,
          ),
          error.message,
        );

        if (!expression) {
          return [];
        }
      } else {
        throw error;
      }
    }
    if (expression.type !== "ObjectExpression") {
      throw new Error("Expected ObjectExpression.");
    }

    return expression.properties
      .map((prop) => {
        if (prop.type === "SpreadElement") {
          this.#error(
            Range.fromOffsets(
              translate(prop.start),
              translate(prop.end),
              this.#string,
            ),
            "Spread syntax is not supported in bindings.",
          );
          return null;
        }

        if (prop.computed) {
          this.#error(
            Range.fromOffsets(
              translate(prop.start),
              translate(prop.end),
              this.#string,
            ),
            "Computed property as binding is not supported.",
          );
          return null;
        }

        let name: string;

        if (prop.key.type === "Identifier") {
          name = prop.key.name;
        } else if (prop.key.type === "Literal" && prop.key.raw) {
          name = prop.key.raw;
        } else {
          this.#error(
            Range.fromOffsets(
              translate(prop.key.start),
              translate(prop.key.end),
              this.#string,
            ),
            "Unsupported property key in binding.",
          );
          return null;
        }

        const incomplete =
          prop.shorthand || prop.value.start - prop.value.end === 0;

        const placeholderExpression = () =>
          new Expression({
            value: "",
            range: Range.fromOffsets(
              translate(prop.start),
              translate(prop.end),
              this.#string,
            ),
          });

        return new Binding({
          name: new Identifier({
            value: name,
            range: Range.fromOffsets(
              translate(prop.key.start),
              translate(prop.key.end),
              this.#string,
            ),
          }),
          param: incomplete
            ? placeholderExpression()
            : new Expression({
                value: expressionText.slice(...prop.value.range!),
                range: Range.fromOffsets(
                  translate(prop.value.start),
                  translate(prop.value.end),
                  this.#string,
                ),
              }),
          parent,
          incomplete,
        });
      })
      .filter((v): v is Binding => v !== null);
  }
  //#endregion

  //#region Primitives
  #isIdentifier(iter: CharIter) {
    return /[a-z$_]/i.test(iter.char());
  }

  #parseIdentifier(iter: CharIter) {
    const start = iter.index();

    let value = "";
    if (this.#isIdentifier(iter)) {
      value = iter.char();
      iter.next();

      while (/[a-z0-9$_]/i.test(iter.char())) {
        value += iter.char();
        iter.next();
      }
    } else {
      throw this.#error(
        this.#range(start, iter.index()),
        "Expected identifier.",
      );
    }

    return new Identifier({
      value,
      range: Range.fromOffsets(start, iter.index(), this.#string),
    });
  }

  #isStringLiteral(iter: CharIter) {
    return iter.char() === '"' || iter.char() === "'";
  }

  #parseStringLiteral(iter: CharIter) {
    const start = iter.index();

    if (!this.#isStringLiteral(iter)) {
      throw this.#error(
        this.#range(start, iter.index()),
        "Expected string literal.",
      );
    }
    const quote = iter.char() as '"' | "'";
    iter.next();

    let value = "";
    while (iter.char() !== quote) {
      if (iter.char() === "\\") {
        iter.next();
        if (!iter.char()) {
          throw this.#error(
            this.#range(start, iter.index()),
            "Unexpected end of input.",
          );
        }
      }
      value += iter.char();
      iter.next();
    }

    if (iter.char() !== quote) {
      throw this.#error(
        this.#range(start, iter.index()),
        "Expected closing quote.",
      );
    }
    iter.next();

    return new StringLiteral({
      value,
      quote,
      range: Range.fromOffsets(start, iter.index(), this.#string),
      inner: Range.fromOffsets(start + 1, iter.index() - 1, this.#string),
    });
  }
  //#endregion

  //#region Helpers
  #isWhitespace(iter: CharIter) {
    return /\s/.test(iter.char());
  }

  #parseWhitespace(iter: CharIter) {
    const start = iter.index();

    if (this.#isWhitespace(iter)) {
      iter.next();

      while (iter.char() && /\s/.test(iter.char())) {
        iter.next();
      }
    } else {
      throw this.#error(
        this.#range(start, iter.index()),
        "Expected whitespace.",
      );
    }

    return Range.fromOffsets(start, iter.index(), this.#string);
  }
  //#endregion
}
