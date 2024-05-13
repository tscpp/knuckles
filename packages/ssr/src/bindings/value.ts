import { setAttribute } from "../helpers.js";
import { type Plugin } from "../plugin.js";
import { Element } from "@knuckles/syntax-tree";

const value: Plugin = {
  filter: (binding) =>
    binding.name.value === "value" && binding.parent instanceof Element,
  ssr({ binding, generated, value }) {
    setAttribute(
      generated,
      binding.parent as Element,
      "value",
      value() === undefined || value() === null ? null : String(value()),
    );
  },
};

export default value;
