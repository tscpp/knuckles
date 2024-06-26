import type { LanguageService } from "../language-service.js";
import { Position } from "@knuckles/location";
import { Element } from "@knuckles/syntax-tree";
import { ts } from "ts-morph";
import * as vscode from "vscode-languageserver/node.js";

export default async function getCompletion(
  service: LanguageService,
  params: vscode.CompletionParams,
): Promise<vscode.CompletionItem[]> {
  const state = await service.getState(params.textDocument);
  if (state.broken) return [];

  const originalPosition = convertPosition(params.position);
  const generatedPosition = state.snapshot.mirror({
    original: originalPosition,
  });
  if (!generatedPosition) {
    return [];
  }

  const quotePreference = getQuotePreferenceAt(originalPosition);

  const completions = state.service!.compilerObject.getCompletionsAtPosition(
    state.sourceFile!.getFilePath(),
    generatedPosition.offset,
    {
      includeCompletionsForImportStatements: false,
      includeCompletionsForModuleExports: false,
      allowRenameOfImportPath: false,
      // TODO: get quote from current binding attribute
      quotePreference,
      triggerCharacter: params.context?.triggerCharacter as
        | ts.CompletionsTriggerCharacter
        | undefined,
      triggerKind: params.context?.triggerKind,
    },
  );
  if (!completions) {
    return [];
  }

  return completions.entries.map(convertCompletion);

  function convertPosition(position: vscode.Position): Position {
    return Position.fromLineAndColumn(
      position.line,
      position.character,
      state.snapshot!.original,
    );
  }

  function convertCompletion(entry: ts.CompletionEntry): vscode.CompletionItem {
    return {
      label: entry.name,
      kind: convertKind(entry.kind),
      preselect: entry.isRecommended,
      insertText: entry.insertText,
      filterText: entry.filterText,
      sortText: entry.sortText,
    };
  }

  function getQuotePreferenceAt(
    position: Position,
  ): "auto" | "double" | "single" {
    let quotePreference: "auto" | "double" | "single" = "auto";

    const node = state.syntaxTree!.getNodeAt(position);
    if (node instanceof Element) {
      const attr = node.attributes.find((attr) => attr.contains(position));
      if (attr) {
        switch (attr.value.quote) {
          case "'":
            quotePreference = "double";
            break;

          case '"':
            quotePreference = "single";
            break;
        }
      }
    }
    return quotePreference;
  }
}

// https://github.com/microsoft/vscode/blob/77e5788/extensions/typescript-language-features/src/languageFeatures/completions.ts#L440
function convertKind(kind: string): vscode.CompletionItemKind {
  switch (kind) {
    case ts.ScriptElementKind.primitiveType:
    case ts.ScriptElementKind.keyword:
      return vscode.CompletionItemKind.Keyword;

    case ts.ScriptElementKind.constElement:
    case ts.ScriptElementKind.letElement:
    case ts.ScriptElementKind.variableElement:
    case ts.ScriptElementKind.localVariableElement:
    case ts.ScriptElementKind.alias:
    case ts.ScriptElementKind.parameterElement:
      return vscode.CompletionItemKind.Variable;

    case ts.ScriptElementKind.memberVariableElement:
    case ts.ScriptElementKind.memberGetAccessorElement:
    case ts.ScriptElementKind.memberSetAccessorElement:
      return vscode.CompletionItemKind.Field;

    case ts.ScriptElementKind.functionElement:
    case ts.ScriptElementKind.localFunctionElement:
      return vscode.CompletionItemKind.Function;

    case ts.ScriptElementKind.memberFunctionElement:
    case ts.ScriptElementKind.constructSignatureElement:
    case ts.ScriptElementKind.callSignatureElement:
    case ts.ScriptElementKind.indexSignatureElement:
      return vscode.CompletionItemKind.Method;

    case ts.ScriptElementKind.enumElement:
      return vscode.CompletionItemKind.Enum;

    case ts.ScriptElementKind.enumMemberElement:
      return vscode.CompletionItemKind.EnumMember;

    case ts.ScriptElementKind.moduleElement:
    case ts.ScriptElementKind.externalModuleName:
      return vscode.CompletionItemKind.Module;

    case ts.ScriptElementKind.classElement:
    case ts.ScriptElementKind.typeElement:
      return vscode.CompletionItemKind.Class;

    case ts.ScriptElementKind.interfaceElement:
      return vscode.CompletionItemKind.Interface;

    case ts.ScriptElementKind.warning:
      return vscode.CompletionItemKind.Text;

    case ts.ScriptElementKind.scriptElement:
      return vscode.CompletionItemKind.File;

    case ts.ScriptElementKind.directory:
      return vscode.CompletionItemKind.Folder;

    case ts.ScriptElementKind.string:
      return vscode.CompletionItemKind.Constant;

    default:
      return vscode.CompletionItemKind.Property;
  }
}
