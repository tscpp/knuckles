import type { LanguageService } from "../language-service.js";
import { quickInfoToMarkdown } from "../utils/text-rendering.js";
import { Position } from "@knuckles/location";
import { Element } from "@knuckles/syntax-tree";
import assert from "node:assert/strict";
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
  const generatedPosition = state.snapshot.mirror({
    original: originalPosition,
  });
  if (!generatedPosition) return null;

  const definition = getAbsoluteDefinitionAt(generatedPosition);

  const node = state.syntaxTree.getNodeAt(originalPosition);
  const binding =
    node instanceof Element
      ? node.bindings.find((binding) => binding.contains(originalPosition))
      : undefined;

  const quickInfo = definition
    ? state.service.compilerObject.getQuickInfoAtPosition(
        definition.getSourceFile().getFilePath(),
        definition.getTextSpan().getStart(),
      )
    : state.service.compilerObject.getQuickInfoAtPosition(
        state.sourceFile.getFilePath(),
        generatedPosition.offset,
      );

  if (!quickInfo) return null;

  // Don't show definition preview when viewing the binding. It's often to
  // verbose to provide any useful information.
  if (binding?.name.contains(originalPosition)) {
    quickInfo.displayParts = undefined;
  }

  return {
    contents: {
      kind: "markdown",
      value: quickInfoToMarkdown(quickInfo),
    },
  };

  function getAbsoluteDefinitionAt(position: Position) {
    assert(!state.broken);

    const [definition] = state.service.getDefinitionsAtPosition(
      state.sourceFile,
      position.offset,
    );
    if (definition) {
      const node = definition.getNode();

      if (
        node.getSourceFile().getFilePath() === state.sourceFile.getFilePath()
      ) {
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
            return definition;
          }
        }
      }
    }

    return undefined;
  }
}
