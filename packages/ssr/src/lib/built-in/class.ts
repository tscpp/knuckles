import { type Plugin } from "../plugin.js";
import * as utils from "../utils.js";
import { Element } from "@knuckles/syntax-tree";

const class_: Plugin = {
  filter: (binding) =>
    binding.name === "class" && binding.parent instanceof Element,
  ssr({ binding, generated, value }) {
    if (!value()) return;

    const element = binding.parent as Element;
    utils.addClass(generated, element, String(value()));
  },
};

export default class_;
