import { addClass, removeClass } from "../helpers.js";
import { type Plugin } from "../plugin.js";
import { Element } from "@knuckles/syntax-tree";

const css: Plugin = {
  filter: (binding) =>
    binding.name.value === "css" && binding.parent instanceof Element,
  ssr({ binding, generated, value }) {
    if (!value() || typeof value() !== "object") return;

    const element = binding.parent as Element;

    for (const [key, value2] of Object.entries(value() as object)) {
      if (value2) {
        addClass(generated, element, key);
      } else {
        removeClass(generated, element, key);
      }
    }
  },
};

export default css;
