import { type RenderOptions, render } from "../lib/exports.js";
import {
  type FilterPattern,
  createFilter,
  dataToEsm,
} from "@rollup/pluginutils";
import type { Plugin } from "rollup";

export interface KnockoutSSRPluginOptions extends RenderOptions {
  /**
   * @default /\.html?$/
   */
  include?: FilterPattern | undefined;
  exclude?: FilterPattern | undefined;
}

export function knockoutSSR(options?: KnockoutSSRPluginOptions): Plugin {
  const filter = createFilter(options?.include ?? /\.html?$/, options?.exclude);

  return {
    name: "@knuckles/ssr",
    async transform(code, id) {
      if (!filter(id)) {
        return;
      }

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
  };
}

export default knockoutSSR;
