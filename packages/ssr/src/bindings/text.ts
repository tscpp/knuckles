import { escapeHtml } from "../helpers.js";
import { type Plugin } from "../plugin.js";

const text: Plugin = {
  filter: (binding) => binding.name.value === "text",
  ssr({ binding, generated, value }) {
    const asHtml = escapeHtml(String(value()));

    if (binding.parent.inner.isEmpty) {
      generated.appendLeft(binding.parent.inner.start.offset, asHtml);
    } else {
      generated.update(
        binding.parent.inner.start.offset,
        binding.parent.inner.end.offset,
        asHtml,
      );
    }
  },
};

export default text;
