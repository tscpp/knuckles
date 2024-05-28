import Renderer from "./renderer.js";
import type { Chunk } from "@knuckles/fabricator";
import type { Document } from "@knuckles/syntax-tree";
import {
  Project,
  type SourceFile,
  type CompilerOptions,
  type FileSystemHost,
} from "ts-morph";

export type TranspileOutput = {
  chunk: Chunk;
  sourceFile: SourceFile;
};

export interface TranspilerOptions {
  tsConfig?: string | CompilerOptions;
  fileSystem?: FileSystemHost | undefined;
}

export class Transpiler {
  #project: Project;

  constructor(options?: TranspilerOptions) {
    this.#project = new Project({
      ...(typeof options?.tsConfig === "string"
        ? { tsConfigFilePath: options.tsConfig }
        : { compilerOptions: options?.tsConfig }),
      skipAddingFilesFromTsConfig: true,
      fileSystem: options?.fileSystem,
    });
  }

  transpile(
    source: string,
    document: Document,
    mode?: "strict" | "loose",
  ): TranspileOutput {
    this.#project.resolveSourceFileDependencies();
    const sourceFiles = this.#project.getSourceFiles();
    for (const sourceFile of sourceFiles) {
      sourceFile.refreshFromFileSystemSync();
    }

    const renderer = new Renderer({
      project: this.#project,
      document: document,
      fileName: source,
      mode,
    });
    const chunk = renderer.render();

    return {
      chunk,
      sourceFile: renderer.sourceFile,
    };
  }
}
