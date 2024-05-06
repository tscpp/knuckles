import { AnalyzerSeverity } from "../../issue.js";
import type { Rule } from "../rule.js";
import { VirtualElement, visit } from "@knuckles/syntax-tree";
import escapeStringRegexp from "escape-string-regexp";

export default {
  name: "virtual-element-end-notation",
  severity: AnalyzerSeverity.Warning,

  check({ report, document }) {
    visit(document, VirtualElement, (node): void => {
      const regex = new RegExp(
        `\\/ko\\s+${escapeStringRegexp(node.binding.name.text)}`,
      );

      if (!regex.test(node.end.content)) {
        report({
          name: this.name,
          message: "Missing notation on virtual element end comment.",
          severity: this.severity,
          start: node.end.range.start,
          end: node.end.range.end,
        });
      }
    });
  },
} satisfies Rule;
