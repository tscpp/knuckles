import { TYPES_MODULE, ns, quote, rmnl } from "./utils.js";
import { Chunk } from "@knuckles/fabricator";
import {
  type Node,
  Element,
  VirtualElement,
  Binding,
  type Document,
  DirectiveElement,
  Scope,
  DirectiveKind,
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
    if (node instanceof Element) {
      let closure: Chunk | undefined;
      for (const binding of node.bindings) {
        closure = new Chunk()
          .add(this.#renderBindingComment(binding))
          .add(this.#renderBindingClosure(binding))
          .write("($context)");
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
      const closure = new Chunk()
        .add(this.#renderBindingComment(node.binding))
        .add(this.#renderBindingClosure(node.binding))
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

    if (node instanceof DirectiveElement) {
      let closure = new Chunk().write("$context");

      if (node.directive.kind === DirectiveKind.With) {
        const param =
          "undefined! as " +
          (node.directive.inline ??
            `${ns}.Interop<(typeof import(${quote(node.directive.import.module)}))[${quote(node.directive.import.specifier)}]>`);

        const mock = new Binding({
          name: new Scope({
            text: "with",
            range: node.directive.name.range,
          }),
          param: new Scope({
            text: param,
            range: node.directive.param.range,
          }),
        });

        closure = new Chunk()
          .write(
            `// "${rmnl(node.directive.name.text)}: ${rmnl(node.directive.param.text)}" (${node.directive.name.range.start.format()})`,
          )
          .nl()
          .add(this.#renderBindingClosure(mock))
          .write("($context)");
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
    return new Chunk()
      .write(
        `// "${rmnl(binding.name.text)}: ${rmnl(binding.param.text)}" (${binding.range.start.format()})`,
      )
      .nl();
  }

  #renderBindingClosure(binding: Binding) {
    const chunk = new Chunk({
      mapping: {
        range: binding.range,
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

    if (/^[a-z$_][a-z$_0-9]*$/i.test(binding.name.text)) {
      chunk //
        .write(".")
        .write(binding.name.text, {
          range: binding.name.range,
          bidirectional: true,
        });
    } else {
      chunk //
        .write("[")
        .write(binding.name.text, {
          range: binding.name.range,
          bidirectional: true,
        })
        .write("]");
    }

    return chunk //
      .write("((")
      .write(binding.param.text, {
        range: binding.param.range,
        bidirectional: true,
      })
      .write("), $context)")
      .write(";")
      .dedent()
      .nl()
      .write("})");
  }
}
