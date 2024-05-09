import "./text-range.scss";
import * as ko from "knockout";
import html from "~/lib/html";
import type { TextRange } from "~/lib/text-range";

ko.components.register("text-range", {
  template: html`<span
    data-bind="
      foreach: lines,
      css: css(),
      event: {
        mouseenter: () => setActive(data),
      },
    "
    ><span data-bind="text: $data" style="white-space: pre"></span
    ><!-- ko if: $index() < $parent.lines().length - 1 --><br /><!-- /ko --></span
  >`,
  viewModel: class {
    readonly data: TextRange;
    readonly active: ko.Observable<TextRange | undefined>;
    readonly highlighted: boolean;

    lines = ko.pureComputed(() => this.data.text.split("\n"));
    css = ko.pureComputed(() => {
      const active = this.highlighted;
      const before =
        active &&
        this.active()!.to.some((range) => this.data.range[0] === range[0]);
      const after =
        active &&
        this.active()!.to.some((range) => this.data.range[1] === range[1]);
      return {
        "text-range": true,
        mapped: this.data.to.length,
        active,
        before,
        after,
      };
    });

    constructor(params: {
      data: TextRange;
      active: ko.Observable<TextRange | undefined>;
      highlighted: boolean;
    }) {
      this.data = params.data;
      this.active = params.active;
      this.highlighted = params.highlighted;
    }

    setActive(textRange: TextRange) {
      if (this.active() !== textRange) {
        this.active(textRange);
      }
    }
  },
});
