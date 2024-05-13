import { escapeHtml, extractIntoTemplate, invertQuote } from "../helpers.js";
import { type Plugin } from "../plugin.js";
import using from "./using.js";

const with_: Plugin = {
  filter: (binding) => binding.name.value === "with",
  async ssr({ binding, generated, value, bubble }) {
    let template: string | undefined;
    const q = invertQuote(binding.attribute?.value.quote ?? '"');

    bubble(() => {
      if (value()) {
        template = extractIntoTemplate(binding, generated);
      }

      let expr = "_ssr_with: { ";
      if (template) {
        expr += `template: ${q}${escapeHtml(template)}${q}, `;
      }
      expr += `value: ${binding.param.value} }`;
      generated.overwrite(...binding.offsets, expr);
    });
  },
  propagate: ({ value }) => !!value,
  extend: using.extend,
};

export default with_;
