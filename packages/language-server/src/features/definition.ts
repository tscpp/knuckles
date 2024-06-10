import type { LanguageService } from "../language-service.js";
import { Position, Range } from "@knuckles/location";
import { pathToFileURL } from "node:url";
import type { DefinitionInfo } from "ts-morph";
import * as vscode from "vscode-languageserver/node.js";

export default async function getDefinition(
  service: LanguageService,
  params: vscode.DefinitionParams,
): Promise<vscode.Definition> {
  const state = await service.getState(params.textDocument);
  if (state.broken) return [];

  const originalPosition = Position.fromLineAndColumn(
    params.position.line,
    params.position.character,
    state.snapshot.original,
  );
  const generatedPosition = state.snapshot.mirror({
    original: originalPosition,
  });

  if (generatedPosition) {
    const definitions = state.service.getDefinitionsAtPosition(
      state.sourceFile,
      generatedPosition.offset,
    );

    return definitions.flatMap((definition): vscode.Location[] => {
      const node = definition.getNode();

      const definitionToLocation = (
        definition: DefinitionInfo,
      ): vscode.Location => {
        const sourceFile = definition.getSourceFile();
        const path = sourceFile.getFilePath();
        const uri = pathToFileURL(path).toString();
        const span = definition.getTextSpan();
        const range1 = Range.fromOffsets(
          span.getStart(),
          span.getEnd(),
          sourceFile.getFullText(),
        );
        const range2 = vscode.Range.create(
          vscode.Position.create(range1.start.line, range1.start.column),
          vscode.Position.create(range1.end.line, range1.end.column),
        );

        return {
          uri: uri,
          range: range2,
        };
      };

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
              uri: state.document.uri,
              range: vscode.Range.create(
                vscode.Position.create(range.start.line, range.start.column),
                vscode.Position.create(range.end.line, range.end.column),
              ),
            },
          ];
        } else {
          const definitions = state.service.getDefinitions(node);
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
