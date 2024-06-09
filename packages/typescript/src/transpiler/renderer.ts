import Scaffold from "./scaffold.js";
import type { Chunk } from "@knuckles/fabricator";
import type { Document } from "@knuckles/syntax-tree";
import {
  type Project,
  type SourceFile,
  ts,
  Symbol,
  SyntaxKind,
} from "ts-morph";

export default class Renderer {
  #scaffold: Chunk;
  #project: Project;
  sourceFile: SourceFile;

  constructor({
    project,
    fileName = "view.html",
    mode,
    document,
  }: {
    project: Project;
    fileName?: string | undefined;
    mode?: "strict" | "loose" | undefined;
    document: Document;
  }) {
    this.#project = project;
    this.#scaffold = new Scaffold(mode).render(document);

    this.sourceFile = this.#project.createSourceFile(
      fileName + ".ts",
      this.#scaffold.text(),
      { overwrite: true },
    );
  }

  #updateSourceFile() {
    this.sourceFile.replaceWithText(this.#scaffold.text());
  }

  render() {
    // Render destructured paramaters for $context and $data.
    for (const marker of this.#scaffold.markers(["context", "data"])) {
      const pos = marker.capture(this.#scaffold.text());

      const declaration = this.sourceFile
        .getDescendantAtPos(pos.offset)
        ?.getParent()
        ?.getParent();
      if (
        !declaration ||
        !declaration.isKind(ts.SyntaxKind.VariableDeclaration)
      ) {
        throw new Error(`Unable to get context declaration.`);
      }

      const initializer = declaration.getInitializerOrThrow();
      const type = initializer.getType();
      const destructured = type
        .getProperties()
        .filter((symbol) => !isPrivateProperty(symbol))
        .map((symbol) => symbol.getName())
        .join(", ");

      this.#scaffold.insert(pos.offset, " " + destructured + " ");
      this.#updateSourceFile();
    }

    // Increment source file version
    // https://github.com/dsherret/ts-morph/blob/886ad6/packages/common/src/compiler/DocumentRegistry.ts#L29
    // prettier-ignore
    (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.#project as any
    )._context.compilerFactory.documentRegistry.createOrUpdateSourceFile(
      this.sourceFile.getFilePath(),
      this.#project.getCompilerOptions(),
      ts.ScriptSnapshot.fromString(this.sourceFile.getFullText()),
    );

    return this.#scaffold;
  }
}

function isPrivateProperty(symbol: Symbol) {
  const declarations = symbol.getDeclarations();
  for (const declaration of declarations) {
    if (declaration.getKind() === SyntaxKind.PropertyDeclaration) {
      const modifierFlags = declaration.getCombinedModifierFlags();
      if (modifierFlags & ts.ModifierFlags.Private) {
        return true;
      }
    }
  }
  return false;
}
