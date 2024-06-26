import {
  Transpiler,
  TranspilerError,
  type TranspilerOutput,
} from "./transpiler/transpiler.js";
import { AnalyzerSeverity, type AnalyzerPlugin } from "@knuckles/analyzer";
import { Position, Range } from "@knuckles/location";
import { ts, type FileSystemHost } from "ts-morph";

export type Options = {
  _fileSystemHost?: FileSystemHost;
};

export default async function (options: Options = {}): Promise<AnalyzerPlugin> {
  let transpiler!: Transpiler;

  return {
    name: "typescript",

    initialize(context) {
      transpiler = new Transpiler({
        tsConfig: context.flags.tsconfig,
        fileSystem: options._fileSystemHost,
        strictness: context.config.analyzer.strictness,
      });
    },

    async analyze(c) {
      let output: TranspilerOutput;
      try {
        output = transpiler.transpile(c.fileName, c.document);
      } catch (error) {
        if (error instanceof TranspilerError) {
          c.report({
            name: "ts/transpile",
            message: error.message,
            start: error.start,
            end: error.end,
            severity: AnalyzerSeverity.Error,
          });
          return;
        } else {
          throw error;
        }
      }
      const sourceFile = output.sourceFile;

      const snapshot = output.chunk.snapshot(c.text);
      c.snapshots.typescript = snapshot;
      c.metadata["tsSourceFile"] = sourceFile;

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
