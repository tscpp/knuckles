import { TYPES_MODULE, ns, quote, rmnl } from "./utils.js";
import { Chunk } from "@knuckles/fabricator";
import {
  type Node,
  Element,
  VirtualElement,
  Binding,
  type Document,
  KoVirtualElement,
  WithVirtualElement,
  Identifier,
  Expression,
} from "@knuckles/syntax-tree";

export default class Scaffold {
  #mode: "strict" | "loose";

  constructor(mode?: "strict" | "loose") {
    this.#mode = mode ?? "loose";
  }

  render(document: Document) {
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
    let closure: Chunk | undefined;

    if (node instanceof Element || node instanceof VirtualElement) {
      if (node instanceof Element) {
        for (const binding of node.bindings) {
          closure = new Chunk()
            .add(this.#renderBindingComment(binding))
            .add(this.#renderBindingClosure(binding))
            .write("($context)");
        }
      }

      if (node instanceof KoVirtualElement) {
        closure = new Chunk()
          .add(this.#renderBindingComment(node.binding))
          .add(this.#renderBindingClosure(node.binding))
          .write("($context)");
      }

      if (node instanceof WithVirtualElement) {
        const mockParam =
          "undefined! as " +
          ns +
          ".Interop<(typeof import(" +
          quote(node.import.module.value) +
          "))" +
          (node.import.identifier.value === "*"
            ? ""
            : "[" + quote(node.import.identifier.value) + "]") +
          ">";

        const mock = new Binding({
          name: new Identifier({
            value: "with",
            range: node.name,
          }),
          param: new Expression({
            value: mockParam,
            range: node.param,
          }),
          // TODO: Fix this unsafe non-null assertion
          parent: undefined!,
        });

        const closure = new Chunk()
          .write(
            `// "${rmnl(node.name.value)}: ${rmnl(node.param.value)}" (${node.name.start.format()})`,
          )
          .nl()
          .add(this.#renderBindingClosure(mock))
          .write("($context)");

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
      .write(`return ${ns}.$`);

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

    return chunk //
      .write("((")
      .write(binding.param.value, {
        range: binding.param,
        bidirectional: true,
      })
      .write("), $context)")
      .write(";")
      .dedent()
      .nl()
      .write("})");
  }
}
