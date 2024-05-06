import { Transpiler } from "./transpiler/transpiler.js";
import {
  AnalyzerSeverity,
  Snapshot,
  type AnalyzerPlugin,
} from "@knuckles/analyzer";
import { Position } from "@knuckles/location";
import { ts } from "ts-morph";

export type Options = {
  tsconfig?: string | ts.CompilerOptions | undefined;
  mode?: "strict" | "loose" | undefined;
};

export default async function (options: Options = {}): Promise<AnalyzerPlugin> {
  const transpiler = new Transpiler({
    tsConfig: options.tsconfig,
  });

  return {
    name: "typescript",

    async analyze(c) {
      const output = transpiler.transpile(c.fileName, c.text, options.mode);
      const sourceFile = output.sourceFile;

      const snapshot = await new Snapshot({
        generated: output.generated,
        original: c.text,
        fileName: c.fileName,
        sourceMap: output.sourceMap,
      });
      c.snapshots.typescript = snapshot;

      if (process.env["KO_PRINT_GENERATED_TYPESCRIPT_SNAPSHOT"] === "true") {
        process.stderr.write(snapshot.generated + "\n");
      }

      const diagnostics = sourceFile.getPreEmitDiagnostics();
      for (const diagnostic of diagnostics) {
        const code = diagnostic.getCode();
        const name = `ts/${code}`;

        const message = ts.flattenDiagnosticMessageText(
          diagnostic.compilerObject.messageText,
          "\n",
        );

        const startOffset = diagnostic.getStart();
        const length = diagnostic.getLength();
        const endOffset =
          startOffset !== undefined && length !== undefined
            ? startOffset + length
            : undefined;

        const start =
          startOffset !== undefined
            ? snapshot.getOriginalPosition(
                Position.fromOffset(startOffset, snapshot.generated),
              ) ?? undefined
            : undefined;
        const end =
          endOffset !== undefined
            ? snapshot.getOriginalPosition(
                Position.fromOffset(endOffset, snapshot.generated),
              ) ?? undefined
            : undefined;

        const category = diagnostic.getCategory();
        let severity: AnalyzerSeverity;

        switch (category) {
          case ts.DiagnosticCategory.Error:
            severity = AnalyzerSeverity.Error;
            break;

          case ts.DiagnosticCategory.Warning:
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
