import { type Plugin } from "../plugin.js";
import * as utils from "../utils.js";
import { Element } from "@knuckles/syntax-tree";

const css: Plugin = {
  filter: (binding) =>
    binding.name === "css" && binding.parent instanceof Element,
  ssr({ binding, generated, value }) {
    if (!value() || typeof value() !== "object") return;

    const element = binding.parent as Element;

    for (const [key, value2] of Object.entries(value() as object)) {
      if (value2) {
        utils.addClass(generated, element, key);
      } else {
        utils.removeClass(generated, element, key);
      }
    }
  },
};

export default css;
