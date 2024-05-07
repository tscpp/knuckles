import { parseImportDeclaration } from "./import.js";
import { TYPES_MODULE, ns, quote, rmnl } from "./utils.js";
import { Chunk } from "@knuckles/fabricator";
import { parse } from "@knuckles/parser";
import {
  type Node,
  Element,
  VirtualElement,
  Binding,
  type Document,
  Directive,
  Scope,
} from "@knuckles/syntax-tree";

export default class Scaffold {
  #mode: "strict" | "loose";

  constructor(mode?: "strict" | "loose") {
    this.#mode = mode ?? "loose";
  }

  render(source: string) {
    const document = parse(source);
    return this.#renderDocument(document);
  }

  #renderDocument(document: Document) {
    return new Chunk()
      .write(`import ${ns} from '${TYPES_MODULE}/${this.#mode}';`)
      .nl(2)
      .write(`declare const $context: ${ns}.BindingContext<{}>;`)
      .nl(2)
      .add(this.#renderNodes(document.children));
  }

  #renderNodes(nodes: readonly Node[]): Chunk[] {
    return nodes
      .map((node) => this.#renderNode(node))
      .filter((value): value is Exclude<typeof value, undefined> => !!value);
  }

  #renderNode(node: Node): Chunk | undefined {
    if (node instanceof Element) {
      let closure: Chunk | undefined;
      for (const binding of node.bindings) {
        closure = this.#renderBindingClosure(
          binding,
          this.#renderBindingComment(binding),
          closure,
        );
      }

      const decendants = this.#renderNodes(node.children);

      if (closure) {
        if (decendants.length > 0) {
          return this.#renderDecendantClosure(closure, decendants) //
            .write(";")
            .nl(2);
        } else {
          return closure //
            .write(";")
            .nl(2);
        }
      } else {
        return new Chunk().add(decendants);
      }
    }

    if (node instanceof VirtualElement) {
      const closure = this.#renderBindingClosure(
        node.binding,
        this.#renderBindingComment(node.binding),
      );
      const decendants = this.#renderNodes(node.children);

      if (decendants.length > 0) {
        return this.#renderDecendantClosure(closure, decendants)
          .write(";")
          .nl(2);
      } else {
        return closure //
          .write(";")
          .nl(2);
      }
    }

    if (node instanceof Directive) {
      let closure = new Chunk().write("$context");

      if (node.name.text === "with" && node.param) {
        let declaration = node.param.text;

        const importDeclaration = parseImportDeclaration(node.param.text);
        if (importDeclaration) {
          declaration = `${ns}.Interop<(typeof import(${quote(importDeclaration.module)}))[${quote(importDeclaration.clause)}]>`;
        }

        const param = `undefined! as ${declaration}`;

        closure = this.#renderBindingClosure(
          new Binding({
            name: node.name,
            param: new Scope({
              text: param,
              range: node.param.range,
            }),
          }),
          new Chunk().write(
            `// "${rmnl(node.name.text)}: ${rmnl(node.param.text)}" (${node.name.range.start.format()})`,
          ),
        );
      }

      const decendants = this.#renderNodes(node.children);

      if (decendants.length > 0) {
        return this.#renderDecendantClosure(closure, decendants)
          .write(";")
          .nl(2);
      } else {
        return closure //
          .write(";")
          .nl(2);
      }
    }

    return undefined;
  }

  #renderDecendantClosure(parent: Chunk, decendants: Chunk[]) {
    return new Chunk()
      .write("(($context) => {")
      .nl()
      .indent()
      .add(decendants)
      .dedent()
      .write("})(")
      .nl()
      .indent()
      .add(parent)
      .dedent()
      .nl()
      .write(")");
  }

  #renderBindingComment(binding: Binding) {
    return new Chunk().write(
      `// "${rmnl(binding.name.text)}: ${rmnl(binding.param.text)}" (${binding.range.start.format()})`,
    );
  }

  #renderBindingClosure(binding: Binding, comment: Chunk, context?: Chunk) {
    const chunk = new Chunk()
      .add(comment)
      .nl()
      .write("(($context) => {")
      .nl()
      .indent()
      .write("const ")
      .locate("context", (c) => c.write("{ }"))
      .write(" = $context;")
      .nl()
      .write("const ")
      .locate("data", (c) => c.write("{ }"))
      .write(" = $context.$data;")
      .nl(2)
      .write(`return ${ns}.$`);

    if (/^[a-z$_][a-z$_0-9]*$/i.test(binding.name.text)) {
      chunk
        .write(".")
        .map(binding.name.range.start.offset)
        .write(binding.name.text);
    } else {
      chunk
        .map(binding.name.range.start.offset)
        .write(`[${quote(binding.name.text)}]`);
    }

    chunk //
      .write("((")
      .map(binding.param.range.start.offset)
      .write(binding.param.text)
      .write("), $context)")
      .map(binding.range.end.offset)
      .write(";")
      .dedent()
      .nl()
      .write("})(");

    if (context) {
      chunk //
        .nl()
        .indent()
        .add(context)
        .dedent()
        .nl();
    } else {
      chunk.write("$context");
    }

    return chunk.write(")");
  }
}
