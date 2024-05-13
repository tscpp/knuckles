import { type Plugin } from "../plugin.js";

const component: Plugin = {
  filter: (binding) => binding.name.value === "component",
  propagate: () => false,
};

export default component;
