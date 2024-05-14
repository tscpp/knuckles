import { type Plugin } from "../plugin.js";

const html: Plugin = {
  filter: (binding) => binding.name.value === "html",
  ssr({ binding, generated, value }) {
    const asHtml = String(value());

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

export default html;
