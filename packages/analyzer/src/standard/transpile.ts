import { Chunk } from "@knuckles/fabricator";
import {
  type SyntaxTree,
  Element,
  type Binding,
  KoVirtualElement,
} from "@knuckles/syntax-tree";

export function transpile(document: SyntaxTree) {
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

  document.visit(
    (node) => {
      for (const binding of node.bindings) {
        render(binding);
      }
    },
    { filter: Element },
  );

  document.visit(
    (node) => {
      for (const binding of node.bindings) {
        render(binding);
      }
    },
    { filter: KoVirtualElement },
  );

  return chunk;
}
