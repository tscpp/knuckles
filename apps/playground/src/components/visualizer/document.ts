import styles from "./document.module.css";
import TextRangeComponent from "./text-range";
import type * as ko from "knockout";
import { Component } from "~/lib/component";
import html from "~/lib/html";
import type { TextRange } from "~/lib/text-range";

export type VisualizerDocumentProps = {
  content: readonly TextRange[];
  highlights: readonly TextRange[];
  active: ko.Observable<TextRange | undefined>;
};

export default class VisualizerDocument extends Component<VisualizerDocumentProps> {
  override components = {
    TextRange: TextRangeComponent,
  };

  // prettier-ignore
  readonly template = html`
    <div class="${styles.document}" data-bind="foreach: props().content"
      ><span
        data-bind="instantiate: [TextRange, {
            data: $data,
            active: $component.props().active,
            highlighted: $component.isHighlighted($data),
          }]"
      ></span
    ></div>
  `;

  isHighlighted(textRange: TextRange) {
    return this.props().highlights.includes(textRange);
  }
}
