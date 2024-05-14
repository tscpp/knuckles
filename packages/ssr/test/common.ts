import * as ssr from "../src/node/index.js";
import { fileURLToPath } from "node:url";

export type HTML = string & { __brand: "HTML" };

export const html = (
  template: TemplateStringsArray,
  ...substitutions: unknown[]
) => String.raw(template, ...substitutions) as HTML;

export const render = async (
  text: HTML,
  url?: URL | undefined,
  options?: Partial<ssr.RenderOptions> | undefined,
) => {
  const fileName = url ? fileURLToPath(url) : undefined;
  return await ssr.render(text, {
    fileName,
    module: fileName ? ssr.createNodeModuleProvider(fileName) : undefined,
    fallback: true,
    ...options,
  });
};
