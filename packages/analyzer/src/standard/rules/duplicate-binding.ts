import { AnalyzerSeverity } from "../../issue.js";
import type { Rule } from "../rule.js";
import { type Binding, Element } from "@knuckles/syntax-tree";

export default {
  name: "duplicate-binding",
  severity: AnalyzerSeverity.Error,

  check({ report, document }) {
    document.visit(
      (node): void => {
        const unique: Binding[] = [];

        for (const binding of node.bindings) {
          const duplicate = unique.some(
            (other) => binding.name.value === other.name.value,
          );

          if (duplicate) {
            report({
              name: this.name,
              message: "Duplicate binding.",
              severity: this.severity,
              start: binding.name.start,
              end: binding.name.end,
            });
          } else {
            unique.push(binding);
          }
        }
      },
      { filter: Element },
    );
  },
} satisfies Rule;
