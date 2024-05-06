import { Chunk } from "@knuckles/fabricator";
import {
  type Document,
  visit,
  Element,
  type Binding,
  VirtualElement,
} from "@knuckles/syntax-tree";

export function transpile(document: Document) {
  const chunk = new Chunk();

  const render = (binding: Binding) => {
    chunk
      .write(`// ${binding.name.text}: ${binding.param.text}`)
      .nl()
      .write("{ ")
      .map(binding.param.range.start.offset)
      .write(binding.param.text)
      .write(" }");
  };

  visit(document, Element, (node) => {
    for (const binding of node.bindings) {
      render(binding);
    }
  });

  visit(document, VirtualElement, (node) => {
    render(node.binding);
  });

  return chunk;
}
