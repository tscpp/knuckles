import type { Config, NormalizedConfig } from "./declaration.js";
import { defaultConfig } from "./default.js";

export async function normalizeConfig(
  config: Config,
): Promise<NormalizedConfig> {
  return {
    attributes: config.attributes?.slice() ?? defaultConfig.attributes,
    analyzer: {
      include:
        config.analyzer?.include?.slice() ?? defaultConfig.analyzer.include,
      exclude:
        config.analyzer?.exclude?.slice() ?? defaultConfig.analyzer.exclude,
      strictness:
        config.analyzer?.strictness ??
        config.analyzer?.mode ??
        defaultConfig.analyzer.strictness,
      plugins: await Promise.all(
        config.analyzer?.plugins?.filter(
          (value): value is Exclude<typeof value, null | undefined | false> =>
            !!value,
        ) ?? defaultConfig.analyzer.plugins,
      ),
      rules: config.analyzer?.rules
        ? { ...config.analyzer.rules }
        : defaultConfig.analyzer.rules,
    },
    ssr: {},
  };
}
