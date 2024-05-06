import Scaffold from "./scaffold.js";
import type { Chunk } from "@knuckles/fabricator";
import { type Project, type SourceFile, ts } from "ts-morph";

export default class Renderer {
  #scaffold: Chunk;
  #project: Project;
  sourceFile: SourceFile;

  constructor({
    project,
    fileName = "view.html",
    mode,
    source,
  }: {
    project: Project;
    fileName?: string | undefined;
    mode?: "strict" | "loose" | undefined;
    source: string;
  }) {
    this.#project = project;
    this.#scaffold = new Scaffold(mode).render(source);

    this.sourceFile = this.#project.createSourceFile(
      fileName + ".ts",
      this.#scaffold.content,
      { overwrite: true },
    );
  }

  #updateSourceFile() {
    this.sourceFile.replaceWithText(this.#scaffold.content);
  }

  render() {
    // Render destructured paramaters for $context and $data.
    for (const occurrence of this.#scaffold.occurrences("context", "data")) {
      const declaration = this.sourceFile
        .getDescendantAtPos(occurrence.start)
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
        .map((symbol) => symbol.getName())
        .join(", ");

      this.#scaffold.insert(occurrence.start + 1, " " + destructured);
      this.#updateSourceFile();
    }

    return this.#scaffold;
  }
}
