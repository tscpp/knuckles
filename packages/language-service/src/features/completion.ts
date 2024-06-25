import type { LanguageServiceWorker } from "../private.js";
import { toPosition, type ProtocolPosition } from "../utils/position.js";
import { type Position } from "@knuckles/location";
import { Element } from "@knuckles/syntax-tree";
import { ts } from "ts-morph";

export interface CompletionParams {
  fileName: string;
  position: ProtocolPosition;
  context?: CompletionContext;
}

export interface CompletionContext {
  triggerCharacter?: string;
  triggerKind?: CompletionTriggerKind;
}

export enum CompletionTriggerKind {
  Invoked = 1,
  TriggerCharacter,
  TriggerForIncompleteCompletions,
}

export enum CompletionItemKind {
  Text,
  Method,
  Function,
  Constructor,
  Field,
  Variable,
  Class,
  Interface,
  Module,
  Property,
  Unit,
  Value,
  Enum,
  Keyword,
  Snippet,
  Color,
  File,
  Reference,
  Folder,
  EnumMember,
  Constant,
  Struct,
  Event,
  Operator,
  TypeParameter,
}

export interface CompletionItem {
  label: string;
  kind: CompletionItemKind;
  preselect: boolean | undefined;
  insertText: string | undefined;
  filterText: string | undefined;
  sortText: string;
}

export type Completion = CompletionItem[];

export default async function getCompletion(
  this: LanguageServiceWorker,
  params: CompletionParams,
): Promise<Completion> {
  const state = await this.getDocumentState(params.fileName);
  if (state.broken) return [];

  const tsService = state.tsProject.getLanguageService();

  const originalPosition = toPosition(params.position, state.document.text);
  const generatedPosition = state.snapshot.mirror({
    original: originalPosition,
  });
  if (!generatedPosition) {
    return [];
  }

  const quotePreference = getQuotePreferenceAt(originalPosition);

  const completions = tsService.compilerObject.getCompletionsAtPosition(
    state.tsSourceFile!.getFilePath(),
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

  function convertCompletion(entry: ts.CompletionEntry): CompletionItem {
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
function convertKind(kind: string): CompletionItemKind {
  switch (kind) {
    case ts.ScriptElementKind.primitiveType:
    case ts.ScriptElementKind.keyword:
      return CompletionItemKind.Keyword;

    case ts.ScriptElementKind.constElement:
    case ts.ScriptElementKind.letElement:
    case ts.ScriptElementKind.variableElement:
    case ts.ScriptElementKind.localVariableElement:
    case ts.ScriptElementKind.alias:
    case ts.ScriptElementKind.parameterElement:
      return CompletionItemKind.Variable;

    case ts.ScriptElementKind.memberVariableElement:
    case ts.ScriptElementKind.memberGetAccessorElement:
    case ts.ScriptElementKind.memberSetAccessorElement:
      return CompletionItemKind.Field;

    case ts.ScriptElementKind.functionElement:
    case ts.ScriptElementKind.localFunctionElement:
      return CompletionItemKind.Function;

    case ts.ScriptElementKind.memberFunctionElement:
    case ts.ScriptElementKind.constructSignatureElement:
    case ts.ScriptElementKind.callSignatureElement:
    case ts.ScriptElementKind.indexSignatureElement:
      return CompletionItemKind.Method;

    case ts.ScriptElementKind.enumElement:
      return CompletionItemKind.Enum;

    case ts.ScriptElementKind.enumMemberElement:
      return CompletionItemKind.EnumMember;

    case ts.ScriptElementKind.moduleElement:
    case ts.ScriptElementKind.externalModuleName:
      return CompletionItemKind.Module;

    case ts.ScriptElementKind.classElement:
    case ts.ScriptElementKind.typeElement:
      return CompletionItemKind.Class;

    case ts.ScriptElementKind.interfaceElement:
      return CompletionItemKind.Interface;

    case ts.ScriptElementKind.warning:
      return CompletionItemKind.Text;

    case ts.ScriptElementKind.scriptElement:
      return CompletionItemKind.File;

    case ts.ScriptElementKind.directory:
      return CompletionItemKind.Folder;

    case ts.ScriptElementKind.string:
      return CompletionItemKind.Constant;

    default:
      return CompletionItemKind.Property;
  }
}
