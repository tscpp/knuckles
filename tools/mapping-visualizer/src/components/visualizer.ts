import "./map-document";
import "./visualizer.css";
import * as ko from "knockout";
import html from "~/lib/html";
import { offsetToPosition, type OffsetArray } from "~/lib/location";
import { computeRanges, type Snapshot, type TextRange } from "~/lib/text-range";

ko.components.register("visualizer", {
  template: html`
    <div class="visualizer">
      <div class="documents">
        <!-- ko foreach: [generatedRanges(), originalRanges()] -->
        <!-- ko component:  {
          name: 'document',
          params: {
            content: $data,
            highlights: $parent.targetTextRanges(),
            active: $parent.activeTextRange
          }
        } --><!-- /ko -->
        <!-- /ko -->
      </div>
      <div class="sidebar">
        <div class="mappings">
          <!-- ko if: activeTextRange -->
          <pre data-bind="text: sourcePositionText"></pre>
          ->
          <pre data-bind="text: targetPositionsText"></pre>
          <!-- /ko -->
        </div>
        <div class="toolbar">
          <button data-bind="click: resetAll">Reset</button>
        </div>
      </div>
    </div>
  `,
  viewModel: class {
    readonly snapshot: Snapshot;

    constructor(params: { snapshot: Snapshot }) {
      this.snapshot = params.snapshot;
    }

    readonly activeTextRange = ko.observable<TextRange | undefined>();
    readonly targetTextRanges = ko.pureComputed(() => {
      const activeTextRange = this.activeTextRange();
      if (!activeTextRange) return [];

      const targetTextRangeArray = this.originalRanges().includes(
        activeTextRange,
      )
        ? this.generatedRanges()
        : this.originalRanges();

      return targetTextRangeArray.filter((textRange) =>
        activeTextRange.to.some(
          (range) =>
            range[0] <= textRange.range[0] && range[1] >= textRange.range[1],
        ),
      );
    });

    isOriginal(textRange: TextRange) {
      return this.originalRanges().includes(textRange);
    }

    isGenerated(textRange: TextRange) {
      return !this.isOriginal(textRange);
    }

    getPositionText(offset: number, source: "original" | "generated") {
      const text = this.snapshot[source];
      const position = offsetToPosition(offset, text);
      return `${position.line + 1}:${position.column + 1}`;
    }

    getRangeText(range: OffsetArray, source: "original" | "generated") {
      return (
        this.getPositionText(range[0], source) +
        ".." +
        this.getPositionText(range[1], source)
      );
    }

    getSource(textRange: TextRange): "original" | "generated" {
      return this.isOriginal(textRange) ? "original" : "generated";
    }

    readonly sourcePositionText = ko.pureComputed(() => {
      const textRange = this.activeTextRange();
      if (!textRange) return undefined;
      return this.getRangeText(textRange.range, this.getSource(textRange));
    });

    readonly targetPositionsText = ko.pureComputed(() => {
      return this.targetTextRanges()
        .map((textRange) =>
          this.getRangeText(textRange.range, this.getSource(textRange)),
        )
        .join("\n");
    });

    readonly generatedRanges = ko.pureComputed(() =>
      computeRanges(this.snapshot, "generated", "original"),
    );
    readonly originalRanges = ko.pureComputed(() =>
      computeRanges(this.snapshot, "original", "generated"),
    );

    resetAll() {
      localStorage.setItem("snapshot", "");
      location.reload();
    }
  },
});
