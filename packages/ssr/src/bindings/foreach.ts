import { randomId, unwrap } from "../helpers.js";
import { type Plugin } from "../plugin.js";

function extract(value: any) {
  if (Array.isArray(value)) {
    return {
      items: value,
      alias: undefined,
    };
  } else if (typeof value === "object") {
    return {
      items: unwrap(value.data),
      alias: unwrap(value.as),
    };
  } else {
    return {
      items: [],
      alias: undefined,
    };
  }
}

const foreach: Plugin = {
  filter: (binding) => binding.name.value === "foreach",
  ssr({ binding, generated, value, propagate, renderFragment, context }) {
    if (propagate === false) {
      return;
    }

    const { items, alias } = extract(value());

    const original = generated.slice(...binding.parent.inner.offsets);

    // Render all fragments
    const fragments = Array.from(Array.from(items).entries()).map(
      ([index, data]) => {
        return renderFragment(
          context.createChildContext(data, alias, (self) => {
            self.$index = index;
          }),
        );
      },
    );
    generated.overwrite(...binding.parent.inner.offsets, fragments.join(""));

    // Append template above element
    const id = randomId();
    generated.appendLeft(
      binding.parent.start.offset,
      `<template id="${id}">${original}</template>`,
    );

    // Replace binding with "_ssr_foreach"
    generated.overwrite(
      ...binding.offsets,
      `_ssr_foreach: { template: "${id}", value: ${binding.param.value} }`,
    );
  },
  propagate: "custom",
};

export default foreach;
