import type { ModuleProvider } from "../module-provider.js";
import { access } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

export function createNodeModuleProvider(
  parent: string,
  override?: Partial<ModuleProvider>,
): ModuleProvider {
  return {
    async resolve(ctx) {
      const importMetaResolve =
        import.meta.resolve ?? (await import("import-meta-resolve")).resolve;

      const parentUrl = pathToFileURL(parent).toString();
      const url = importMetaResolve(ctx.specifier, parentUrl);
      const path = fileURLToPath(url);

      try {
        await access(path);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          return { success: false };
        } else {
          throw error;
        }
      }

      return { id: path };
    },

    async load(ctx) {
      const url = pathToFileURL(ctx.id).toString();
      const exports = await import(url);
      return { exports };
    },

    ...override,
  };
}
