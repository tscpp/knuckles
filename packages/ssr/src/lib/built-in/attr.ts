import { type Plugin } from "../plugin.js";
import * as utils from "../utils.js";
import { Element } from "@knuckles/syntax-tree";

const attr: Plugin = {
  filter: (binding) =>
    binding.name === "attr" && binding.parent instanceof Element,
  ssr({ binding, generated, value }) {
    if (!value()) return;

    const element = binding.parent as Element;

    for (const [key, value2] of Object.entries(value() as object)) {
      utils.setAttribute(generated, element, key, value2);
    }
  },
};

export default attr;
