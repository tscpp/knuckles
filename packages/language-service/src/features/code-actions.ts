import type { LanguageServiceWorker } from "../private.js";
import {
  type ProtocolPosition,
  type ProtocolRange,
} from "../utils/position.js";
import { Range } from "@knuckles/location";

export interface DiagnosticIdentifier {
  code: string;
  range: ProtocolRange;
}

export interface CodeActionParams {
  fileName: string;
  position: ProtocolPosition;
  diagnostics?: DiagnosticIdentifier[];
}

export interface CodeAction {
  label: string;
  edits: CodeActionEdit[];
  diagnostic?: DiagnosticIdentifier;
}

export type CodeActionEdit =
  | {
      type: "create-file";
      fileName: string;
    }
  | {
      type: "delete-file";
      fileName: string;
    }
  | {
      type: "rename-file";
      oldFileName: string;
      newFileName: string;
    }
  | {
      type: "delete";
      fileName: string;
      range: ProtocolRange;
    }
  | {
      type: "replace";
      fileName: string;
      range: ProtocolRange;
      text: string;
    }
  | {
      type: "insert";
      fileName: string;
      position: ProtocolPosition;
      text: string;
    };

export type CodeActions = CodeAction[];

export default async function getCodeActions(
  this: LanguageServiceWorker,
  params: CodeActionParams,
): Promise<CodeActions> {
  const state = await this.getDocumentState(params.fileName);
  if (state.broken) return [];

  const codeActions: CodeActions = [];

  for (const issue of state.issues) {
    if (issue.quickFix) {
      const diagnostic = (params.diagnostics ?? []).find((diagnostic) =>
        Range.fromLinesAndColumns(
          diagnostic.range.start.line,
          diagnostic.range.start.column,
          diagnostic.range.end.line,
          diagnostic.range.end.column,
          state.document.text,
        ),
      );
      const label = issue.quickFix.label ?? "Fix this issue";
      const edits = issue.quickFix.edits.map((edit): CodeActionEdit => {
        if (edit.text.length === 0) {
          return {
            type: "delete",
            fileName: params.fileName,
            range: edit.range,
          };
        } else if (edit.range.size === 0) {
          return {
            type: "insert",
            fileName: params.fileName,
            position: edit.range.start.toJSON(),
            text: edit.text,
          };
        } else {
          return {
            type: "replace",
            fileName: params.fileName,
            range: edit.range.toJSON(),
            text: edit.text,
          };
        }
      });
      codeActions.push({
        label,
        edits,
        diagnostic,
      });
    }
  }

  return codeActions;
}
