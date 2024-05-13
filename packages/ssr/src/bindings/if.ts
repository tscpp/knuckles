import { extractIntoTemplate, invertQuote } from "../helpers.js";
import { type Plugin } from "../plugin.js";

export const if_: Plugin = createIfPlugin(
  (binding) => binding.name.value === "if",
  true,
);
export const ifnot: Plugin = createIfPlugin(
  (binding) => binding.name.value === "ifnot",
  false,
);

function createIfPlugin(filter: Plugin["filter"], test: boolean): Plugin {
  return {
    filter,
    propagate: ({ value }) => value() == test,
    ssr({ binding, generated, value, bubble }) {
      bubble(() => {
        const tmpl =
          value() == test
            ? undefined
            : extractIntoTemplate(binding, generated);

        const q = invertQuote(binding.attribute?.value.quote ?? '"');

        // Replace binding with "_ssr_if"
        generated.overwrite(
          ...binding.offsets,
          `_ssr_if: { ${tmpl ? `template: ${q}${tmpl}${q}, ` : ""}value: ${
            binding.param.value
          } }`,
        );
      });
    },
  };
}
