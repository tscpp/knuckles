import { AnalyzerSeverity } from "../../issue.js";
import type { Rule } from "../rule.js";
import { KoVirtualElement, visit } from "@knuckles/syntax-tree";
import escapeStringRegexp from "escape-string-regexp";

export default {
  name: "virtual-element-end-notation",
  severity: AnalyzerSeverity.Warning,

  check({ report, document }) {
    visit(document, KoVirtualElement, (node): void => {
      const regex = new RegExp(
        `\\/ko\\s+${escapeStringRegexp(node.binding.name.value)}`,
      );

      if (!regex.test(node.endComment.content)) {
        report({
          name: this.name,
          message: "Missing notation on virtual element end comment.",
          severity: this.severity,
          start: node.endComment.start,
          end: node.endComment.end,
        });
      }
    });
  },
} satisfies Rule;
