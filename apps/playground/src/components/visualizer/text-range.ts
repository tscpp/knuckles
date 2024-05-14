import styles from "./text-range.module.scss";
import * as ko from "knockout";
import { Component } from "~/lib/component";
import html from "~/lib/html";
import type { TextRange } from "~/lib/text-range";

export type TextRangeProps = {
  data: TextRange;
  active: ko.Observable<TextRange | undefined>;
  highlighted: boolean;
};

export default class TextRangeComponent extends Component<TextRangeProps> {
  template = html`<span
    data-bind="
      foreach: lines,
      css: css(),
      event: {
        mouseenter: onHover,
      },
    "
    ><span data-bind="text: $data" style="white-space: pre"></span
    ><!-- ko if: $index() < $parent.lines().length - 1 --><br /><!-- /ko --></span
  >`;

  lines = ko.pureComputed(() => this.props().data.text.split("\n"));
  css = ko.pureComputed(() => {
    const active = this.props().highlighted;
    const before =
      active &&
      this.props()
        .active()!
        .to.some((range) => this.props().data.range[0] === range[0]);
    const after =
      active &&
      this.props()
        .active()!
        .to.some((range) => this.props().data.range[1] === range[1]);
    return {
      [styles.textRange!]: true,
      [styles.mapped!]: this.props().data.to.length,
      [styles.active!]: active,
      [styles.before!]: before,
      [styles.after!]: after,
    };
  });

  setActive(textRange: TextRange) {
    if (this.props().active() !== textRange) {
      this.props().active(textRange);
    }
  }

  onHover() {
    const textRange = this.props().data;
    // Don't change active text range if it is unmapped.
    if (textRange.to.length > 0) {
      this.setActive(textRange);
    }
  }
}
