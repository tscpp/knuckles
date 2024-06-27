import type { LanguageServiceWorker } from "../private.js";
import { toPosition, type ProtocolPosition } from "../utils/position.js";
import { quickInfoToMarkdown } from "../utils/text-rendering.js";
import { Position } from "@knuckles/location";
import { Element } from "@knuckles/syntax-tree";
import assert from "node:assert/strict";

export interface HoverParams {
  fileName: string;
  position: ProtocolPosition;
}

export interface Hover {
  documentation: string;
}

export default async function getHover(
  this: LanguageServiceWorker,
  params: HoverParams,
): Promise<Hover | null> {
  const state = await this.getDocumentState(params.fileName);
  if (state.broken) return null;

  const tsService = state.tsProject.getLanguageService();

  // Translate to position in generated snapshot.
  const originalPosition = toPosition(params.position, state.document.text);
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
    ? tsService.compilerObject.getQuickInfoAtPosition(
        definition.getSourceFile().getFilePath(),
        definition.getTextSpan().getStart(),
      )
    : tsService.compilerObject.getQuickInfoAtPosition(
        state.tsSourceFile.getFilePath(),
        generatedPosition.offset,
      );

  if (!quickInfo) return null;

  // Don't show definition preview when viewing the binding. It's often to
  // verbose to provide any useful information.
  if (binding?.name.contains(originalPosition)) {
    quickInfo.displayParts = undefined;
  }

  return {
    documentation: quickInfoToMarkdown(quickInfo),
  };

  function getAbsoluteDefinitionAt(position: Position) {
    assert(!state.broken);

    const [definition] = tsService.getDefinitionsAtPosition(
      state.tsSourceFile,
      position.offset,
    );
    if (definition) {
      const node = definition.getNode();

      if (
        node.getSourceFile().getFilePath() === state.tsSourceFile.getFilePath()
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
          const [definition] = tsService.getDefinitions(node);

          if (definition) {
            return definition;
          }
        }
      }
    }

    return undefined;
  }
}
