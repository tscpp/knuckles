import { setStyle } from "../helpers.js";
import { type Plugin } from "../plugin.js";
import { Element } from "@knuckles/syntax-tree";

export const visible: Plugin = {
  filter: (binding) =>
    binding.name.value === "visible" && binding.parent instanceof Element,
  ssr({ binding, generated, value }) {
    setStyle(
      generated,
      binding.parent as Element,
      "display",
      value() ? null : "none",
    );
  },
};

export const hidden: Plugin = {
  filter: (binding) =>
    binding.name.value === "hidden" && binding.parent instanceof Element,
  ssr({ binding, generated, value }) {
    setStyle(
      generated,
      binding.parent as Element,
      "display",
      value() ? "none" : null,
    );
  },
};
