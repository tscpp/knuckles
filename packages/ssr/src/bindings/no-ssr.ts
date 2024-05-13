import { type Plugin } from "../plugin.js";

const noSsr: Plugin = {
  filter: (binding) => binding.name.value === "noSsr" || binding.name.value === "noSSR",
  propagate: () => false,
};

export default noSsr;
