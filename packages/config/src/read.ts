import type { Config, NormalizedConfig } from "./declaration.js";
import { normalizeConfig } from "./normalize.js";
import { pathToFileURL } from "node:url";

function interopConfigModule(module: object): Config {
  return (
    Object.hasOwn(module, "default")
      ? (module as { default?: unknown }).default
      : module
  ) as Config;
}

export async function readConfigFileRaw(
  path: string,
  version?: string | undefined,
): Promise<Config> {
  const url = pathToFileURL(path).toString();
  const module = await import(url + (version ? `?v=${version}` : ""));
  const config = interopConfigModule(module);
  return config;
}

export async function readConfigFile(
  path: string,
  version?: string | undefined,
): Promise<NormalizedConfig> {
  const config = await readConfigFileRaw(path, version);
  const normalized = await normalizeConfig(config);
  return normalized;
}
