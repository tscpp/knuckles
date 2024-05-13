import { setAttribute } from "../helpers.js";
import { type Plugin } from "../plugin.js";
import { Element } from "@knuckles/syntax-tree";

const checked: Plugin = {
  filter: (binding) =>
    binding.name.value === "checked" && binding.parent instanceof Element,
  ssr({ binding, generated, value }) {
    setAttribute(
      generated,
      binding.parent as Element,
      "checked",
      value() ? "" : null,
    );
  },
};

export default checked;
