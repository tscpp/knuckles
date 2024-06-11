import Renderer from "./renderer.js";
import type { Chunk } from "@knuckles/fabricator";
import type { Document } from "@knuckles/syntax-tree";
import {
  Project,
  type SourceFile,
  type CompilerOptions,
  type FileSystemHost,
  ts,
} from "ts-morph";

export type TranspileOutput = {
  chunk: Chunk;
  sourceFile: SourceFile;
};

export interface TranspilerOptions {
  tsConfig?: string | CompilerOptions;
  fileSystem?: FileSystemHost | undefined;
}

const defaultCompilerOptions = {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2016,
  strict: true,
  esModuleInterop: true,
  forceConsistentCasingInFileNames: true,
  skipLibCheck: true,
};

export class Transpiler {
  #project: Project;

  constructor(options?: TranspilerOptions) {
    this.#project = new Project({
      ...(typeof options?.tsConfig === "string"
        ? { tsConfigFilePath: options.tsConfig }
        : options?.tsConfig ?? defaultCompilerOptions),
      skipAddingFilesFromTsConfig: true,
      fileSystem: options?.fileSystem,
    });
  }

  transpile(
    source: string,
    document: Document,
    mode?: "strict" | "loose",
  ): TranspileOutput {
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
    this.#project.resolveSourceFileDependencies();
    const chunk = renderer.render();

    return {
      chunk,
      sourceFile: renderer.sourceFile,
    };
  }
}
