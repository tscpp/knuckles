import Renderer from "./renderer.js";
import type { Mapping } from "@knuckles/fabricator";
import { Project, type SourceFile, type CompilerOptions } from "ts-morph";

export type TranspileOutput = {
  generated: string;
  mappings: Mapping[];
  sourceFile: SourceFile;
};

export interface TranspilerOptions {
  tsConfig?: string | CompilerOptions;
}

export class Transpiler {
  #project: Project;

  constructor(options?: TranspilerOptions) {
    this.#project = new Project({
      ...(typeof options?.tsConfig === "string"
        ? { tsConfigFilePath: options.tsConfig }
        : { compilerOptions: options?.tsConfig }),
      skipAddingFilesFromTsConfig: true,
    });
  }

  transpile(
    source: string,
    original: string,
    mode?: "strict" | "loose",
  ): TranspileOutput {
    const renderer = new Renderer({
      project: this.#project,
      source: original,
      fileName: source,
      mode,
    });
    const chunk = renderer.render();

    return {
      generated: chunk.content,
      mappings: chunk.getMappings(original),
      sourceFile: renderer.sourceFile,
    };
  }
}
