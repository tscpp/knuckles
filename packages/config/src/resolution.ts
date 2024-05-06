import { access, stat } from "node:fs/promises";
import { resolve } from "node:path";

/**
 * Searches for the directory for the config file name without traversing.
 */
export async function findConfigFile(
  directory: string,
  fileName?: string,
): Promise<string | null> {
  const fileNames = fileName
    ? [fileName]
    : [
        "knuckles.config.js",
        "knuckles.config.mjs",
        "knuckles.config.cjs",
        "knuckles.config.ts",
        "knuckles.config.mts",
        "knuckles.config.cts",
      ];

  for (const fileName of fileNames) {
    try {
      const path = resolve(directory, fileName);
      await access(path);
      return path;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        continue;
      } else {
        break;
      }
    }
  }

  return null;
}

/**
 * Traverses the directory tree to find the config file path.
 */
export async function discoverConfigFile(
  searchPath: string,
  fileName?: string,
): Promise<string | null> {
  const search = async (directory: string): Promise<string | null> => {
    const filePath = await findConfigFile(directory, fileName);

    if (filePath) {
      return filePath;
    } else {
      const parentDirectory = resolve(directory, "..");

      if (parentDirectory === directory) {
        return null;
      } else {
        return await search(parentDirectory);
      }
    }
  };

  const stats = await stat(searchPath);

  if (stats.isDirectory()) {
    return search(searchPath);
  } else {
    return search(resolve(searchPath, ".."));
  }
}
