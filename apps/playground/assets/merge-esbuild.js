/**
 * @param {import('esbuild').BuildOptions} a
 * @param {import('esbuild').BuildOptions} b
 * @returns {import('esbuild').BuildOptions}
 */
export default function merge(a, b) {
  return {
    ...a,
    ...b,
    alias: a.alias || b.alias ? { ...a.alias, ...b.alias } : undefined,
    loader: a.loader || b.loader ? { ...a.loader, ...b.loader } : undefined,
    resolveExtensions:
      a.resolveExtensions || b.resolveExtensions
        ? [...(a.resolveExtensions ?? []), ...(b.resolveExtensions ?? [])]
        : undefined,
    mainFields:
      a.mainFields || b.mainFields
        ? [...(a.mainFields ?? []), ...(b.mainFields ?? [])]
        : undefined,
    conditions:
      a.conditions || b.conditions
        ? [...(a.conditions ?? []), ...(b.conditions ?? [])]
        : undefined,
    outExtension:
      a.outExtension || b.outExtension
        ? { ...a.outExtension, ...b.outExtension }
        : undefined,
    banner: a.banner || b.banner ? { ...a.banner, ...b.banner } : undefined,
    footer: a.footer || b.footer ? { ...a.footer, ...b.footer } : undefined,
    entryPoints: [
      ...(a.entryPoints
        ? Array.isArray(a.entryPoints)
          ? a.entryPoints
          : Object.entries(a.entryPoints).map(([key, value]) => ({
              in: value,
              out: key,
            }))
        : []),
      ...(b.entryPoints
        ? Array.isArray(b.entryPoints)
          ? b.entryPoints
          : Object.entries(b.entryPoints).map(([key, value]) => ({
              in: value,
              out: key,
            }))
        : []),
    ],
    stdin: a.stdin || b.stdin ? { ...a.stdin, ...b.stdin } : undefined,
    plugins:
      a.plugins || b.plugins
        ? [...(a.plugins ?? []), ...(b.plugins ?? [])]
        : undefined,
    nodePaths:
      a.nodePaths || b.nodePaths
        ? [...(a.nodePaths ?? []), ...(b.nodePaths ?? [])]
        : undefined,
    target:
      a.target || b.target
        ? [
            ...(a.target
              ? Array.isArray(a.target)
                ? a.target
                : [a.target]
              : []),
            ...(b.target
              ? Array.isArray(b.target)
                ? b.target
                : [b.target]
              : []),
          ]
        : undefined,
    supported:
      a.supported || b.supported
        ? { ...a.supported, ...b.supported }
        : undefined,
    mangleCache:
      a.mangleCache || b.mangleCache
        ? { ...a.mangleCache, ...b.mangleCache }
        : undefined,
    drop: a.drop || b.drop ? [...(a.drop ?? []), ...(b.drop ?? [])] : undefined,
    dropLabels:
      a.dropLabels || b.dropLabels
        ? [...(a.dropLabels ?? []), ...(b.dropLabels ?? [])]
        : undefined,
    define: a.define || b.define ? { ...a.define, ...b.define } : undefined,
    pure: a.pure || b.pure ? [...(a.pure ?? []), ...(b.pure ?? [])] : undefined,
    logOverride:
      a.logOverride || b.logOverride
        ? { ...a.logOverride, ...b.logOverride }
        : undefined,
  };
}
