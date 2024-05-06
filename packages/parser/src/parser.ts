import {
  isParse5CommentNode,
  isParse5Element,
  isParse5TextNode,
  parse5,
  parse5LocationToRange,
  type parse5TreeAdapter,
} from "./parse5-utils.js";
import { Range, Position } from "@knuckles/location";
import {
  Document,
  type Node,
  Text,
  VirtualElement,
  Comment,
  Element,
  Attribute,
  Binding,
  Scope,
} from "@knuckles/syntax-tree";
import * as acorn from "acorn";

const virtualElementStart = /^(\s*(#?)ko\s+)([^\s]+)(\s*:\s*)([^]*?)(\s*)$/;
const virtualElementEnd = /^\s*\/ko\s[^]*$/;

export interface ParseOptions {
  bindingAttributes?: readonly string[];
  onError?: ((error: parse5.ParserError) => void) | undefined;
}

export function parse(document: string, options?: ParseOptions) {
  const parser = new Parser(document, options);
  return parser.parse();
}

class Parser {
  #bindingAttributes: readonly string[];
  #onError: ((error: parse5.ParserError) => void) | undefined;
  #source: string;

  constructor(source: string, options?: ParseOptions) {
    this.#source = source;
    this.#bindingAttributes = options?.bindingAttributes ?? ["data-bind"];
    this.#onError = options?.onError;
  }

  parse(): Document {
    const root = parse5.parseFragment(this.#source, {
      sourceCodeLocationInfo: true,
      scriptingEnabled: false,
      onParseError: this.#onError,
    });
    const iter = root.childNodes[Symbol.iterator]();
    const children: Node[] = [];
    let result: IteratorResult<parse5TreeAdapter.Node> | undefined;

    while (!(result = iter.next()).done) {
      children.push(this.#parseNode(result.value, iter));
    }

    return new Document(children, new Range(Position.zero, Position.zero));
  }

  #parseNode(
    node: parse5TreeAdapter.Node,
    iter: Iterator<parse5TreeAdapter.Node>,
  ): Node {
    switch (true) {
      case isParse5TextNode(node): {
        return new Text(
          node.value,
          parse5LocationToRange(node.sourceCodeLocation!),
        );
      }
      case isParse5CommentNode(node): {
        if (virtualElementStart.test(node.data)) {
          const [
            spacing1,
            prefix,
            bindingName,
            _spacing2,
            bindingParam,
            spacing3,
          ] = virtualElementStart.exec(node.data)!.slice(1) as [
            string,
            string,
            string,
            string,
            string,
            string,
          ];

          const hidden = prefix === "#";

          let balance = 1;
          const children: parse5TreeAdapter.Node[] = [];
          let result: IteratorResult<parse5TreeAdapter.Node> | undefined;
          let endComment: parse5TreeAdapter.CommentNode | undefined;

          while (!(result = iter.next()).done) {
            if (isParse5CommentNode(result.value)) {
              if (virtualElementStart.test(result.value.data)) {
                ++balance;
              } else if (virtualElementEnd.test(result.value.data)) {
                --balance;

                if (balance === 0) {
                  endComment = result.value as parse5TreeAdapter.CommentNode;
                  break;
                }
              }
            }

            children.push(result.value);
          }

          if (!endComment) {
            throw new Error("Unbalanced virtual element (knockout comment).");
          }

          const iter2 = children[Symbol.iterator]();
          const children2: Node[] = [];
          let result2: IteratorResult<parse5TreeAdapter.Node> | undefined;

          while (!(result2 = iter2.next()).done) {
            children2.push(this.#parseNode(result2.value, iter2));
          }

          const virtualElement = new VirtualElement(
            undefined!,
            hidden,
            children2,
            new Comment(
              node.data,
              parse5LocationToRange(node.sourceCodeLocation!),
            ),
            new Comment(
              endComment.data,
              parse5LocationToRange(endComment.sourceCodeLocation!),
            ),
            new Range(
              parse5LocationToRange(node.sourceCodeLocation!).start,
              parse5LocationToRange(endComment.sourceCodeLocation!).end,
            ),
          );

          // Hack self reference
          (virtualElement as { binding: Binding }).binding = new Binding(
            new Scope(
              bindingName,
              new Range(
                Position.fromOffset(
                  node.sourceCodeLocation!.startOffset +
                    "<!--".length +
                    spacing1.length,
                  this.#source,
                ),
                Position.fromOffset(
                  node.sourceCodeLocation!.startOffset +
                    "<!--".length +
                    spacing1.length +
                    bindingName.length,
                  this.#source,
                ),
              ),
            ),
            new Scope(
              bindingParam,
              new Range(
                Position.fromOffset(
                  node.sourceCodeLocation!.endOffset -
                    bindingParam.length -
                    spacing3.length -
                    "-->".length,
                  this.#source,
                ),
                Position.fromOffset(
                  node.sourceCodeLocation!.endOffset -
                    spacing3.length -
                    "-->".length,
                  this.#source,
                ),
              ),
            ),
            virtualElement,
            parse5LocationToRange(node.sourceCodeLocation!),
          );

          return virtualElement;
        } else {
          return new Comment(
            node.data,
            parse5LocationToRange(node.sourceCodeLocation!),
          );
        }
      }
      case isParse5Element(node): {
        const iter = node.childNodes[Symbol.iterator]();
        const children: Node[] = [];
        let current: IteratorResult<parse5TreeAdapter.Node> | undefined;

        while (!(current = iter.next()).done) {
          children.push(this.#parseNode(current.value, iter));
        }

        const attributes = node.attrs.map((attr) => {
          const _quote = this.#source.at(
            node.sourceCodeLocation!.attrs![attr.name]!.startOffset +
              attr.name.length +
              1,
          );
          const quoted = (["'", '"'] as unknown[]).includes(_quote);
          const quote = quoted ? (_quote as '"' | "'") : null;

          const range = parse5LocationToRange(
            node.sourceCodeLocation!.attrs![attr.name]!,
          );

          return new Attribute(
            new Scope(
              attr.name,
              new Range(
                range.start,
                Position.fromOffset(
                  range.start.offset + attr.name.length,
                  this.#source,
                ),
              ),
            ),
            new Scope(
              attr.value,
              new Range(
                Position.fromOffset(
                  range.start.offset +
                    // name
                    attr.name.length +
                    // equal
                    1 +
                    // quote
                    (quoted ? 1 : 0),
                  this.#source,
                ),
                range.end,
              ),
            ),
            attr.namespace,
            attr.prefix,
            quote,
            range,
          );
        });

        const bindings = attributes
          .filter((attr) => this.#bindingAttributes.includes(attr.name.text))
          .flatMap((attr): Binding[] => {
            const expressionText = `({${attr.value.text}})`;
            const expression = acorn.parseExpressionAt(expressionText, 0, {
              ecmaVersion: "latest",
              sourceType: "script",
              ranges: true,
            });
            if (expression.type !== "ObjectExpression") {
              throw new Error("Expected ObjectExpression.");
            }

            const translate = (offset: number) =>
              // name
              attr.name.range.end.offset +
              // quote
              (attr.quote ? 1 : 0) +
              // offset
              offset -
              // TODO: No idea why?
              1;

            return expression.properties.map((prop) => {
              if (prop.type === "SpreadElement") {
                throw new Error("Spread syntax is not supported in bindings.");
              }

              if (prop.computed) {
                throw new Error(
                  "Computed property as binding is not supported.",
                );
              }

              let name: string;

              if (prop.key.type === "Identifier") {
                name = prop.key.name;
              } else if (prop.key.type === "Literal" && prop.key.raw) {
                name = prop.key.raw;
              } else {
                throw new Error("Unsupported property key in binding.");
              }

              return new Binding(
                new Scope(
                  name,
                  new Range(
                    Position.fromOffset(
                      translate(prop.key.range![0]),
                      this.#source,
                    ),
                    Position.fromOffset(
                      translate(prop.key.range![1]),
                      this.#source,
                    ),
                  ),
                ),
                new Scope(
                  expressionText.slice(...prop.value.range!),
                  new Range(
                    Position.fromOffset(
                      translate(prop.value.range![0]),
                      this.#source,
                    ),
                    Position.fromOffset(
                      translate(prop.value.range![1]),
                      this.#source,
                    ),
                  ),
                ),
                attr,
                new Range(
                  Position.fromOffset(translate(prop.range![0]), this.#source),
                  Position.fromOffset(translate(prop.range![1]), this.#source),
                ),
              );
            });
          });

        return new Element(
          node.tagName,
          attributes,
          bindings,
          children,
          parse5LocationToRange(node.sourceCodeLocation!),
        );
      }
      default: {
        throw new Error("Unexpected node type");
      }
    }
  }
}
