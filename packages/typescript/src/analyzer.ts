import { Transpiler } from "./transpiler/transpiler.js";
import { AnalyzerSeverity, type AnalyzerPlugin } from "@knuckles/analyzer";
import { Position, Range } from "@knuckles/location";
import { ts, type FileSystemHost } from "ts-morph";

export type Options = {
  tsconfig?: string | ts.CompilerOptions | undefined;
  mode?: "strict" | "loose" | undefined;
  fileSystem?: FileSystemHost;
};

export default async function (options: Options = {}): Promise<AnalyzerPlugin> {
  const transpiler = new Transpiler({
    tsConfig: options.tsconfig,
    fileSystem: options.fileSystem,
  });

  return {
    name: "typescript",

    async analyze(c) {
      const output = transpiler.transpile(c.fileName, c.document, options.mode);
      const sourceFile = output.sourceFile;

      const snapshot = output.chunk.snapshot(c.text);
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

        let range: Range | null | undefined;

        if (startOffset !== undefined) {
          if (endOffset !== undefined) {
            range = snapshot.mirror({
              generated: new Range(
                Position.fromOffset(startOffset, snapshot.generated),
                Position.fromOffset(endOffset, snapshot.generated),
              ),
            });
          }

          if (!range) {
            range = snapshot.blame({
              generated: Position.fromOffset(startOffset, snapshot.generated),
            });
          }
        }

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
          start: range?.start,
          end: range?.end,
          severity,
        });
      }
    },
  };
}
