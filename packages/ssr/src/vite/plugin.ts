import { type RenderOptions, render, type Diagnostic } from "../lib/exports.js";
import { dataToEsm } from "@rollup/pluginutils";
import type { RollupLog } from "rollup";
import { type FilterPattern, type Plugin, createFilter } from "vite";

export interface KnockoutSSRPluginOptions extends RenderOptions {
  /**
   * @default /\.html?$/
   */
  include?: FilterPattern | undefined;
  exclude?: FilterPattern | undefined;
}

export function knockoutSSR(options?: KnockoutSSRPluginOptions): Plugin {
  const filter = createFilter(options?.include ?? /\.html?$/, options?.exclude);

  const toRollupLog = (diagnostic: Diagnostic): RollupLog => ({
    message: diagnostic.message,
    cause: diagnostic.cause,
    code: diagnostic.code,
    pos: diagnostic.range?.start.offset,
  });

  return {
    name: "@knuckles/ssr",
    async transform(code, id) {
      if (!filter(id)) return null;

      const result = await render(code, {
        ...options,
        filename: id,
        resolve: async (specifier) => {
          const resolved = await this.resolve(specifier, id);
          return resolved?.id ?? null;
        },
      });

      for (const error of result.errors) {
        this.error(toRollupLog(error));
      }

      for (const warning of result.warnings) {
        this.warn(toRollupLog(warning));
      }

      if (result.document) {
        return {
          code: dataToEsm(result.document),
          map: result.sourceMap,
        };
      } else {
        return null;
      }
    },
  };
}

export default knockoutSSR;
