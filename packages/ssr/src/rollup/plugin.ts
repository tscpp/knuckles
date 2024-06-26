import {
  type RenderOptions,
  render,
  type Diagnostic,
  createNodeModuleProvider,
} from "../node/index.js";
import {
  type FilterPattern,
  createFilter,
  dataToEsm,
} from "@rollup/pluginutils";
import type { Plugin, RollupLog } from "rollup";

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
      if (!filter(id)) {
        return;
      }

      const moduleProvider = createNodeModuleProvider(id, {
        resolve: async (ctx) => {
          const resolved = await this.resolve(ctx.specifier, id);
          return { id: resolved?.id };
        },
      });

      const result = await render(code, {
        ...options,
        fileName: id,
        module: moduleProvider,
      });

      for (const error of result.errors) {
        this.error(toRollupLog(error));
      }

      for (const warning of result.warnings) {
        this.warn(toRollupLog(warning));
      }

      if (result.modified) {
        return {
          code: dataToEsm(result.modified),
          map: result.sourceMap,
        };
      } else {
        return null;
      }
    },
  };
}

export default knockoutSSR;
