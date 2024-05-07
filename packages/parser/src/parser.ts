import {
  isParse5CommentNode,
  isParse5Element,
  isParse5TextNode,
  parse5 as p5,
  parse5LocationToRange,
  type parse5TreeAdapter as p5t,
} from "./parse5-utils.js";
import { Range, Position } from "@knuckles/location";
import {
  Document,
  type Node,
  Text,
  Comment,
  Element,
  Attribute,
  Binding,
  Scope,
  VirtualElement,
  type ChildNode,
  Directive,
} from "@knuckles/syntax-tree";
import * as acorn from "acorn";

const VIRTUAL_ELEMENT_OR_DIRECTIVE_START_REGEX = //
  /^(\s*(#?)ko\s+)([^\s]+)\s*:\s*([^]*?)(\s*)$/;

const VIRTUAL_ELEMENT_OR_DIRECTIVE_END_REGEX = //
  /^\s*\/ko\s[^]*$/;

export interface ParseOptions {
  bindingAttributes?: readonly string[];
  onError?: ((error: p5.ParserError) => void) | undefined;
}

export function parse(document: string, options?: ParseOptions) {
  const parser = new Parser(document, options);
  return parser.parse();
}

function p5Range(node: p5t.Node): Range {
  return parse5LocationToRange(node.sourceCodeLocation!);
}

class Parser {
  #bindingAttributes: readonly string[];
  #onError: ((error: p5.ParserError) => void) | undefined;
  #source: string;

  constructor(source: string, options?: ParseOptions) {
    this.#source = source;
    this.#bindingAttributes = options?.bindingAttributes ?? ["data-bind"];
    this.#onError = options?.onError;
  }

  parse(): Document {
    const root = p5.parseFragment(this.#source, {
      sourceCodeLocationInfo: true,
      scriptingEnabled: false,
      onParseError: this.#onError,
    });
    const iter = root.childNodes[Symbol.iterator]();
    const children: Node[] = [];
    let result: IteratorResult<p5t.Node> | undefined;

    while (!(result = iter.next()).done) {
      children.push(this.#parseNode(result.value, iter));
    }

    return new Document({
      children,
      range: new Range(Position.zero, Position.zero),
    });
  }

  #parseNode(node: p5t.Node, iter: Iterator<p5t.Node>): Node {
    switch (true) {
      case isParse5TextNode(node): {
        return new Text({
          content: node.value,
          range: p5Range(node),
        });
      }
      case isParse5CommentNode(node): {
        if (VIRTUAL_ELEMENT_OR_DIRECTIVE_START_REGEX.test(node.data)) {
          return this.#parseVirtualElementOrDirective(node, iter);
        } else {
          return new Comment({
            content: node.data,
            range: p5Range(node),
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

  #parseVirtualElementOrDirective(
    node: p5t.CommentNode,
    iter: Iterator<p5t.Node>,
  ): VirtualElement | Directive {
    const [paddingStart, prefix, nameText, paramText, paddingEnd] =
      VIRTUAL_ELEMENT_OR_DIRECTIVE_START_REGEX.exec(node.data)!.slice(1) as [
        string,
        string,
        string,
        string,
        string,
        string,
      ];

    const startComment = new Comment({
      content: node.data,
      range: p5Range(node),
    });

    const children: ChildNode[] = [];
    let endComment: Comment | undefined;

    let result: IteratorResult<p5t.Node> | undefined;
    while (!(result = iter.next()).done) {
      const childNode = result.value;

      if (isParse5CommentNode(childNode)) {
        const isEndComment = VIRTUAL_ELEMENT_OR_DIRECTIVE_END_REGEX.test(
          childNode.data,
        );

        if (isEndComment) {
          endComment = new Comment({
            content: childNode.data,
            range: p5Range(childNode),
          });
          break;
        }
      }

      children.push(this.#parseNode(childNode, iter) as ChildNode);
    }

    if (!endComment) {
      throw new Error(`Unbalanced virtual elements (knockout comments).`);
    }

    // Calculate the offsets for name...
    const nameStartOffset =
      node.sourceCodeLocation!.startOffset +
      "<!--".length +
      paddingStart.length;
    const nameEndOffset = nameStartOffset + nameText.length;

    // ... and param.
    const paramEndOffset =
      node.sourceCodeLocation!.endOffset - paddingEnd.length - "-->".length;
    const paramStartOffset = paramEndOffset - paramText.length;

    const name = new Scope({
      text: nameText,
      range: Range.fromOffset(nameStartOffset, nameEndOffset, this.#source),
    });

    let param: Scope | null = null;
    if (paramText.length > 0) {
      param = new Scope({
        text: paramText,
        range: Range.fromOffset(paramStartOffset, paramEndOffset, this.#source),
      });
    }

    const internal = prefix === "#";

    if (internal) {
      return new Directive({
        name,
        param,
        children,
        startComment,
        endComment,
      });
    } else {
      if (!param) {
        throw new Error("Virtual element is missing param.");
      }

      const binding = new Binding({
        name,
        param,
      });

      return new VirtualElement({
        binding,
        children,
        startComment,
        endComment,
      });
    }
  }

  #parseElement(node: p5t.Element) {
    const iter = node.childNodes[Symbol.iterator]();
    const children: Node[] = [];
    let current: IteratorResult<p5t.Node> | undefined;

    while (!(current = iter.next()).done) {
      children.push(this.#parseNode(current.value, iter));
    }

    const attributes = node.attrs.map((attr) =>
      this.#parseAttribute(node, attr),
    );

    const bindings = attributes
      .filter((attr) => this.#bindingAttributes.includes(attr.name.text))
      .flatMap((attr) => this.#parseAttributeBindings(attr));

    return new Element({
      tagName: node.tagName,
      attributes,
      bindings,
      children,
      range: p5Range(node),
    });
  }

  #parseAttribute(node: p5t.Element, attr: p5.Token.Attribute) {
    const firstChar = this.#source.at(
      node.sourceCodeLocation!.attrs![attr.name]!.startOffset +
        attr.name.length +
        1,
    );
    const quoted = (["'", '"'] as unknown[]).includes(firstChar);
    const quote = quoted ? (firstChar as '"' | "'") : null;

    const range = parse5LocationToRange(
      node.sourceCodeLocation!.attrs![attr.name]!,
    );

    return new Attribute({
      name: new Scope({
        text: attr.name,
        range: new Range(
          range.start,
          Position.fromOffset(
            range.start.offset + attr.name.length,
            this.#source,
          ),
        ),
      }),
      value: new Scope({
        text: attr.value,
        range: new Range(
          Position.fromOffset(
            range.start.offset +
              // name
              attr.name.length +
              // equal
              1,
            this.#source,
          ),
          range.end,
        ),
      }),
      namespace: attr.namespace,
      prefix: attr.prefix,
      quote,
      range,
    });
  }

  #parseAttributeBindings(attr: Attribute) {
    const expressionText = `({${attr.value.text}})`;
    const expression = acorn.parseExpressionAt(expressionText, 0, {
      ecmaVersion: "latest",
      sourceType: "script",
      ranges: true,
    });
    if (expression.type !== "ObjectExpression") {
      throw new Error("Expected ObjectExpression.");
    }

    const innerOffset =
      // name
      attr.name.range.end.offset +
      // equal
      1 +
      // quote
      (attr.quote ? 1 : 0);

    const translate = (offset: number) =>
      innerOffset +
      offset -
      // attribute value is wrapped in expressionText
      2;

    return expression.properties.map((prop) => {
      if (prop.type === "SpreadElement") {
        throw new Error("Spread syntax is not supported in bindings.");
      }

      if (prop.computed) {
        throw new Error("Computed property as binding is not supported.");
      }

      let name: string;

      if (prop.key.type === "Identifier") {
        name = prop.key.name;
      } else if (prop.key.type === "Literal" && prop.key.raw) {
        name = prop.key.raw;
      } else {
        throw new Error("Unsupported property key in binding.");
      }

      return new Binding({
        name: new Scope({
          text: name,
          range: Range.fromOffset(
            translate(prop.key.range![0]),
            translate(prop.key.range![1]),
            this.#source,
          ),
        }),
        param: new Scope({
          text: expressionText.slice(...prop.value.range!),
          range: Range.fromOffset(
            translate(prop.value.range![0]),
            translate(prop.value.range![1]),
            this.#source,
          ),
        }),
        attribute: attr,
      });
    });
  }
}
