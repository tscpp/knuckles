import type { LanguageService } from "../language-service.js";
import { Position } from "@knuckles/location";
import type { ts } from "ts-morph";
import type * as vscode from "vscode-languageserver/node.js";

export default async function getHover(
  service: LanguageService,
  params: vscode.HoverParams,
): Promise<vscode.Hover | null> {
  const state = await service.getState(params.textDocument);
  if (state.broken) return null;

  // Translate to position in generated snapshot.
  const originalPosition = Position.fromLineAndColumn(
    params.position.line,
    params.position.character,
    state.snapshot.original,
  );
  const generatedRange = state.snapshot.mirror({
    original: originalPosition,
  });
  if (!generatedRange) return null;

  let quickInfo: ts.QuickInfo | undefined;

  // To avoid display hover info for the local definition of a property
  // (deconstructed from $data or $context), we'll try to get the definition.
  const [definition] = state.service.getDefinitionsAtPosition(
    state.sourceFile,
    generatedRange.offset,
  );
  if (definition) {
    const node = definition.getNode();

    if (node.getSourceFile().getFilePath() === state.sourceFile.getFilePath()) {
      const generatedStartOffset = node.getStart();
      const generatedPosition = Position.fromOffset(
        generatedStartOffset,
        state.snapshot.generated,
      );
      const originalPosition = state.snapshot.mirror({
        generated: generatedPosition,
      });

      if (!originalPosition) {
        const [definition] = state.service.getDefinitions(node);

        if (definition) {
          quickInfo = state.service.compilerObject.getQuickInfoAtPosition(
            definition.getSourceFile().getFilePath(),
            definition.getTextSpan().getStart(),
          );
        }
      }
    }
  }

  // Fallback case
  quickInfo ??= state.service.compilerObject.getQuickInfoAtPosition(
    state.sourceFile.getFilePath(),
    generatedRange.offset,
  );

  if (!quickInfo) return null;

  // Translate "ts quick info" to "vscode hover info".
  return {
    contents: [
      ...(quickInfo.displayParts
        ? [
            {
              language: "typescript",
              value: quickInfo.displayParts.map((part) => part.text).join(""),
            },
          ]
        : []),
    ],
  };
}
