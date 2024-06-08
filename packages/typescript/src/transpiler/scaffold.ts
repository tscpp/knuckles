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
    // TODO: revise
    // return this.#mode === "strict" ? "unknown" : "any";
    return "any";
  }

  render(document: Document) {
    return this.#renderDocument(document);
  }

  #renderDocument(document: Document) {
    return new Chunk()
      .append(`import ${ns} from '@knuckles/typescript/types';`)
      .newline(2)
      .append(
        `declare const $context: {
          $parentContext: Knuckles.BindingContext | undefined;
          $parents: Knuckles.BindingContext[];
          $parent: Knuckles.BindingContext | undefined;
          $root: ${this.#unknown};
          $data: ${this.#unknown};
          $rawData: ${this.#unknown};
        };`,
      )
      .newline(2)
      .append(this.#renderNodes(document.children));
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
            .append(this.#renderBindingComment(binding))
            .append(this.#renderBindingClosure(binding), { blame: binding })
            .append("(")
            .append(closure ?? new Chunk().append("$context"))
            .append(")");
        }
      }

      if (node instanceof KoVirtualElement) {
        closure = new Chunk()
          .append(this.#renderBindingComment(node.binding))
          .append(this.#renderBindingClosure(node.binding), {
            blame: node.binding,
          })
          .append("($context)");
      }

      if (node instanceof WithVirtualElement) {
        closure = new Chunk()
          .append(
            `// "${rmnl(node.name.value)}: ${rmnl(node.param.value)}" (${node.name.start.format()})`,
          )
          .newline()
          .append("(($context) => ")
          .newline()
          .append(`${ns}.hints.with(${ns}.type<typeof import(`)
          .append(quote(node.import.module.value))
          .append(")")
          .append(
            node.import.identifier.value === "*"
              ? ""
              : "[" + quote(node.import.identifier.value) + "]",
          )
          .append(">(), $context)")
          .newline()
          .append(")($context)");
      }

      const decendants = this.#renderNodes(node.children);

      if (closure) {
        if (decendants.length > 0) {
          return this.#renderDecendantClosure(closure, decendants) //
            .append(";")
            .newline(2);
        } else {
          return closure //
            .append(";")
            .newline(2);
        }
      } else {
        return new Chunk().append(decendants);
      }
    }

    return undefined;
  }

  #renderDecendantClosure(parent: Chunk, decendants: Chunk[]) {
    return new Chunk()
      .append("(($context) => {")
      .newline()
      .append(decendants)
      .append("})(")
      .newline()
      .append(parent)
      .newline()
      .append(")");
  }

  #renderBindingComment(binding: Binding) {
    return new Chunk()
      .append(
        `// "${rmnl(binding.name.value)}: ${rmnl(binding.param.value)}" (${binding.start.format()})`,
      )
      .newline();
  }

  #renderBindingClosure(binding: Binding) {
    const chunk = new Chunk()
      .append("(($context) => {")
      .newline()
      .append("const ")
      .append("{")
      .marker("context")
      .append("}")
      .append(" = $context;")
      .newline()
      .append("const ")
      .append("{")
      .marker("data")
      .append("}")
      .append(" = $context.$data;")
      .newline(2)
      .append(`return ${ns}.${this.#mode}`);
    if (/^[a-z$_][a-z$_0-9]*$/i.test(binding.name.value)) {
      chunk //
        .append(".")
        .append(binding.name.value, { mirror: binding.name });
    } else {
      chunk //
        .append("[")
        .append(binding.name.value, { mirror: binding.name })
        .append("]");
    }

    chunk.append("(");

    if (binding.parent instanceof Element) {
      chunk.append(
        new Chunk()
          .append(`${ns}.element("`)
          .append(binding.parent.tagName.value, {
            mirror: binding.parent.tagName,
          })
          .append('")'),
        { blame: binding.name },
      );
    } else {
      chunk //
        .append(`${ns}.comment()`, {
          blame: binding.parent,
        });
    }

    return chunk
      .append(", ") //
      .append(binding.param.value, { mirror: binding.param })
      .append(", $context)")
      .append(";")
      .newline()
      .append("})");
  }
}
