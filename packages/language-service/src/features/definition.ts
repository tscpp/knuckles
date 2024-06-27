import type { LanguageServiceWorker } from "../private.js";
import {
  toPosition,
  toProtocolRange,
  type ProtocolLocation,
  type ProtocolPosition,
} from "../utils/position.js";
import { Position, Range } from "@knuckles/location";
import type { DefinitionInfo } from "ts-morph";

export interface DefinitionParams {
  fileName: string;
  position: ProtocolPosition;
}

export interface Definition extends Array<ProtocolLocation> {}

export default async function getDefinition(
  this: LanguageServiceWorker,
  params: DefinitionParams,
): Promise<Definition> {
  const state = await this.getDocumentState(params.fileName);
  if (state.broken) return [];

  const tsService = state.tsProject.getLanguageService();

  const position = toPosition(params.position, state.document.text);

  const generatedPosition = state.snapshot.mirror({
    original: position,
  });

  if (generatedPosition) {
    const definitions = tsService.getDefinitionsAtPosition(
      state.tsSourceFile,
      generatedPosition.offset,
    );

    return definitions.flatMap((definition): ProtocolLocation[] => {
      const node = definition.getNode();

      const definitionToLocation = (
        definition: DefinitionInfo,
      ): ProtocolLocation => {
        const sourceFile = definition.getSourceFile();
        const path = sourceFile.getFilePath();
        const span = definition.getTextSpan();
        const range = Range.fromOffsets(
          span.getStart(),
          span.getEnd(),
          sourceFile.getFullText(),
        );

        return {
          path,
          range: toProtocolRange(range),
        };
      };

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

        if (originalPosition) {
          const generatedEndOffset = node.getEnd();
          // TODO: don't assume the original length is the same as the generated.
          const length = generatedEndOffset - generatedStartOffset;
          const range = new Range(
            originalPosition,
            Position.fromOffset(
              originalPosition.offset + length,
              state.snapshot.original,
            ),
          );
          return [
            {
              path: state.document.path,
              range: toProtocolRange(range),
            },
          ];
        } else {
          const definitions = tsService.getDefinitions(node);
          return definitions.map((definition) =>
            definitionToLocation(definition),
          );
        }
      } else {
        return [definitionToLocation(definition)];
      }
    });
  } else {
    return [];
  }
}
