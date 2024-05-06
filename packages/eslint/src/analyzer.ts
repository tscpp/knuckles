import {
  type AnalyzerPlugin,
  type Snapshot,
  AnalyzerSeverity,
} from "@knuckles/analyzer";
import { Position } from "@knuckles/location";
import { Linter } from "eslint";

enum ESLintSeverity {
  Off = 0,
  Warn = 1,
  Error = 2,
}

export type Options = {
  language?: "typescript" | "javascript" | "auto";
  cwd?: string;
  config: Linter.Config | Linter.FlatConfig[];
};

export default function (options: Options): AnalyzerPlugin {
  const languageOption = options.language ?? "auto";
  const flatConfig = Array.isArray(options.config);

  const linter = new Linter({
    configType: flatConfig ? "flat" : undefined,
    cwd: options?.cwd,
  });

  return {
    name: "eslint",

    dependencies:
      languageOption === "javascript"
        ? {
            javascript: {},
          }
        : languageOption === "typescript"
          ? {
              typescript: {},
            }
          : {
              javascript: { optional: true },
              typescript: { optional: true },
            },

    async analyze(c) {
      let snapshot: Snapshot;
      let language: "typescript" | "javascript";

      if (
        languageOption === "typescript" ||
        (languageOption === "auto" && c.snapshots.typescript)
      ) {
        language = "typescript";
        snapshot = c.snapshots.typescript!;
      } else {
        language = "javascript";
        snapshot = c.snapshots.javascript;
      }

      const extension = (
        {
          typescript: ".ts",
          javascript: ".js",
        } as const
      )[language];

      const diagnostics = linter.verify(snapshot.generated, options.config, {
        filename: c.fileName + extension,
      });

      for (const diagnostic of diagnostics) {
        const name = diagnostic.ruleId ?? "eslint/unknown";
        const message = diagnostic.message;

        const start =
          snapshot.getOriginalPosition(
            Position.fromLineAndColumn(
              diagnostic.line,
              diagnostic.column,
              snapshot.generated,
            ),
          ) ?? undefined;

        const end =
          diagnostic.endLine !== undefined && diagnostic.endColumn !== undefined
            ? snapshot.getOriginalPosition(
                Position.fromLineAndColumn(
                  diagnostic.endLine,
                  diagnostic.endColumn,
                  snapshot.generated,
                ),
              ) ?? undefined
            : undefined;

        let severity: AnalyzerSeverity;
        switch (diagnostic.severity) {
          case ESLintSeverity.Error:
            severity = AnalyzerSeverity.Error;
            break;

          case ESLintSeverity.Warn:
            severity = AnalyzerSeverity.Warning;
            break;

          default:
            continue;
        }

        c.report({
          name,
          message,
          start,
          end,
          severity,
        });
      }
    },
  };
}

// export default class ESLintAnalyzerPlugin extends AnalyzerPlugin<{
//   typescript?: boolean
// }> {
//   readonly name = "eslint"

//   async prepare() {

//   }

//   async analyze(entry: Entry) {

//   }

//   create({ transform, transpiled, report }) {
//     transform(({ chunk }) => {
//       chunk.insert(0, "/* eslint-disable */\n");

//       const occurrences = chunk.occurrences(
//         "binding access",
//         "binding value expression",
//       );

//       for (const occurance of occurrences) {
//         chunk.insert(occurance.start, "/* eslint-enable */");
//         chunk.insert(occurance.end, "/* eslint-disable */");
//       }
//     });

//     transpiled(({ sourceFile }) => {
//       const text = sourceFile.getFullText();

//       // run eslint on text...

//       report({
//         name: "some-eslint-issue",
//         range: undefined!,
//       });
//     });
//   }
// };
