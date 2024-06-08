import { Chunk } from "@knuckles/fabricator";
import {
  type Document,
  visit,
  Element,
  type Binding,
  KoVirtualElement,
} from "@knuckles/syntax-tree";

export function transpile(document: Document) {
  const chunk = new Chunk();

  const render = (binding: Binding) => {
    chunk
      .append(`// ${binding.name.value}: ${binding.param.value}`)
      .newline()
      .while(
        (chunk) =>
          chunk
            .append("{ ") //
            .append(binding.param.value, { mirror: binding.param })
            .append(" }"),
        { blame: binding },
      );
  };

  visit(document, Element, (node) => {
    for (const binding of node.bindings) {
      render(binding);
    }
  });

  visit(document, KoVirtualElement, (node) => {
    render(node.binding);
  });

  return chunk;
}
