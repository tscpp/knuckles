import { type Plugin } from "../plugin.js";
import * as utils from "../utils.js";
import { Element } from "@knuckles/syntax-tree";

export const visible: Plugin = {
  filter: (binding) =>
    binding.name === "visible" && binding.parent instanceof Element,
  ssr({ binding, generated, value }) {
    utils.setStyle(
      generated,
      binding.parent as Element,
      "display",
      value() ? null : "none",
    );
  },
};

export const hidden: Plugin = {
  filter: (binding) =>
    binding.name === "hidden" && binding.parent instanceof Element,
  ssr({ binding, generated, value }) {
    utils.setStyle(
      generated,
      binding.parent as Element,
      "display",
      value() ? "none" : null,
    );
  },
};
