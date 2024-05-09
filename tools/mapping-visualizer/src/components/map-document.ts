import "./map-document.css";
import "./text-range";
import * as ko from "knockout";
import html from "~/lib/html";
import type { TextRange } from "~/lib/text-range";

ko.components.register("document", {
  template: html`<div class="document">
    <code data-bind="foreach: content"
      ><span
        data-bind="component: {
          name: 'text-range',
          params: {
            data: $data,
            active: $parent.active,
            highlighted: $parent.isHighlighted($data),
          }
        }"
      ></span
    ></code>
  </div>`,
  viewModel: class {
    content: readonly TextRange[];
    highlights: readonly TextRange[];
    active: ko.Observable<TextRange | undefined>;

    constructor(params: {
      content: readonly TextRange[];
      highlights: readonly TextRange[];
      active: ko.Observable<TextRange | undefined>;
    }) {
      this.content = params.content;
      this.highlights = params.highlights;
      this.active = params.active;
    }

    isHighlighted(textRange: TextRange) {
      return this.highlights.includes(textRange);
    }
  },
});
