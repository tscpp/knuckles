import { type RenderOptions, render } from "../lib/exports.js";
import { dataToEsm } from "@rollup/pluginutils";
import { type FilterPattern, type Plugin, createFilter } from "vite";

export interface KnockoutSSRPluginOptions extends RenderOptions {
  /**
   * @default /\.html?$/
   */
  include?: FilterPattern | undefined;
  exclude?: FilterPattern | undefined;
  transformIndexHtml?: boolean | undefined;
}

export function knockoutSSR(options?: KnockoutSSRPluginOptions): Plugin {
  const filter = createFilter(options?.include ?? /\.html?$/, options?.exclude);

  return {
    name: "@knuckles/ssr",
    async transform(code, id) {
      if (!filter(id)) return null;

      const generated = await render(code, {
        ...options,
        filename: id,
        resolve: async (specifier) => {
          const resolved = await this.resolve(specifier, id);
          return resolved?.id ?? null;
        },
      });

      return {
        code: dataToEsm(generated.document),
        map: null,
      };
    },
    ...(options?.transformIndexHtml !== false && {
      async transformIndexHtml(html, ctx) {
        const generated = await render(html, {
          ...options,
          filename: ctx.filename,
        });
        return generated.document;
      },
    }),
  };
}

export default knockoutSSR;
