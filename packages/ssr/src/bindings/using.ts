import { type Plugin } from "../plugin.js";

const using: Plugin = {
  filter: (binding) => binding.name.value === "using",
  extend({ parent }) {
    const as = parent.siblings.find(
      (sibling) => sibling.binding.name.value === "as",
    );

    return parent.context.createChildContext(
      parent.rawValue(),
      as ? String(as.value()) : undefined,
    );
  },
};

export default using;
