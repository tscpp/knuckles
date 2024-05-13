import { addClass } from "../helpers.js";
import { type Plugin } from "../plugin.js";
import { Element } from "@knuckles/syntax-tree";

const class_: Plugin = {
  filter: (binding) =>
    binding.name.value === "class" && binding.parent instanceof Element,
  ssr({ binding, generated, value }) {
    if (!value()) return;

    const element = binding.parent as Element;
    addClass(generated, element, String(value()));
  },
};

export default class_;
