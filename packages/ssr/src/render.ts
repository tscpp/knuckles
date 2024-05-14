import type { DiagnosticError, DiagnosticWarning } from "./diagnostic.js";
import { Renderer, type RendererOptions } from "./renderer.js";

export interface RenderOptions extends RendererOptions {
  fileName?: string | undefined;
}

export type RenderResult = {
  errors: DiagnosticError[];
  warnings: DiagnosticWarning[];
  modified: string | null;
  sourceMap: string | null;
};

export async function render(
  text: string,
  options: RenderOptions = {},
): Promise<RenderResult> {
  const renderer = new Renderer(text, options);
  await renderer.render();
  const modified = renderer.modified.toString();
  const sourceMap = renderer.modified.generateMap({
    source: options.fileName,
    includeContent: true,
  });
  return {
    errors: renderer.errors,
    warnings: renderer.warnings,
    modified,
    sourceMap: sourceMap.toString(),
  };
}
