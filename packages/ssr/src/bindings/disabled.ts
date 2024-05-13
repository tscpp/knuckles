import { setAttribute } from "../helpers.js";
import { type Plugin } from "../plugin.js";
import { Element } from "@knuckles/syntax-tree";

export const enabled = createEnablePlugin("enabled", true);
export const disabled = createEnablePlugin("disabled", false);

function createEnablePlugin(name: string, thruthy: boolean): Plugin {
  return {
    filter: (binding) =>
      binding.name.value === name && binding.parent instanceof Element,
    ssr({ binding, generated, value }) {
      setAttribute(
        generated,
        binding.parent as Element,
        "disabled",
        value() == thruthy ? null : "",
      );
    },
  };
}
