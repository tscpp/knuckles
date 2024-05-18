import { ns, quote, rmnl } from "./utils.js";
import { Chunk } from "@knuckles/fabricator";
import {
  type Node,
  Element,
  VirtualElement,
  type Binding,
  type Document,
  KoVirtualElement,
  WithVirtualElement,
} from "@knuckles/syntax-tree";

export default class Scaffold {
  #mode: "strict" | "loose";

  constructor(mode?: "strict" | "loose") {
    this.#mode = mode ?? "loose";
  }

  get #unknown() {
    return this.#mode === "strict" ? "unknown" : "any";
  }

  render(document: Document) {
    return this.#renderDocument(document);
  }

  #renderDocument(document: Document) {
    return new Chunk()
      .write(`import ${ns} from '@knuckles/typescript/types';`)
      .nl(2)
      .write(
        `declare const $context: {
          $parentContext: Knuckles.BindingContext | undefined;
          $parents: Knuckles.BindingContext[];
          $parent: Knuckles.BindingContext | undefined;
          $root: ${this.#unknown};
          $data: ${this.#unknown};
          $rawData: ${this.#unknown};
        };`,
      )
      .nl(2)
      .add(this.#renderNodes(document.children));
  }

  #renderNodes(nodes: readonly Node[]): Chunk[] {
    return nodes
      .map((node) => this.#renderNode(node))
      .filter((value): value is Exclude<typeof value, undefined> => !!value);
  }

  #renderNode(node: Node): Chunk | undefined {
    let closure: Chunk | undefined;

    if (node instanceof Element || node instanceof VirtualElement) {
      if (node instanceof Element) {
        for (const binding of node.bindings) {
          closure = new Chunk()
            .add(this.#renderBindingComment(binding))
            .add(this.#renderBindingClosure(binding))
            .write("(")
            .add(closure ?? new Chunk().write("$context"))
            .write(")");
        }
      }

      if (node instanceof KoVirtualElement) {
        closure = new Chunk()
          .add(this.#renderBindingComment(node.binding))
          .add(this.#renderBindingClosure(node.binding))
          .write("($context)");
      }

      if (node instanceof WithVirtualElement) {
        closure = new Chunk()
          .write(
            `// "${rmnl(node.name.value)}: ${rmnl(node.param.value)}" (${node.name.start.format()})`,
          )
          .nl()
          .write("(($context) => ")
          .nl()
          .indent()
          .write(`${ns}.hints.with(${ns}.type<typeof import(`)
          .write(quote(node.import.module.value))
          .write(")")
          .write(
            node.import.identifier.value === "*"
              ? ""
              : "[" + quote(node.import.identifier.value) + "]",
          )
          .write(">(), $context)")
          .dedent()
          .nl()
          .write(")($context)");
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
    return new Chunk()
      .write(
        `// "${rmnl(binding.name.value)}: ${rmnl(binding.param.value)}" (${binding.start.format()})`,
      )
      .nl();
  }

  #renderBindingClosure(binding: Binding) {
    const chunk = new Chunk({
      mapping: {
        range: binding,
      },
    })
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
      .write(`return ${ns}.${this.#mode}`);

    if (/^[a-z$_][a-z$_0-9]*$/i.test(binding.name.value)) {
      chunk //
        .write(".")
        .write(binding.name.value, {
          range: binding.name,
          bidirectional: true,
        });
    } else {
      chunk //
        .write("[")
        .write(binding.name.value, {
          range: binding.name,
          bidirectional: true,
        })
        .write("]");
    }

    chunk.write("(");

    if (binding.parent instanceof Element) {
      chunk.add(
        new Chunk({
          mapping: {
            range: binding.name,
          },
        })
          .write(`${ns}.element("`)
          .write(binding.parent.tagName.value, {
            range: binding.parent.tagName,
            bidirectional: true,
          })
          .write('")'),
      );
    } else {
      chunk //
        .write(`${ns}.comment()`, {
          range: binding.parent,
        });
    }

    return chunk
      .write(", ") //
      .write(binding.param.value, {
        range: binding.param,
        bidirectional: true,
      })
      .write(", $context)")
      .write(";")
      .dedent()
      .nl()
      .write("})");
  }
}
