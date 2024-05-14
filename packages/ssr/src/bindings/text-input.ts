import { type Plugin } from "../plugin.js";
import value from "./value.js";
import { Element } from "@knuckles/syntax-tree";

const textInput: Plugin = {
  filter: (binding) =>
    binding.name.value === "textInput" && binding.parent instanceof Element,
  ssr: value.ssr,
};

export default textInput;
