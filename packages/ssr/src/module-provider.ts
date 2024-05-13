export type ModuleProviderResolveContext = {
  specifier: string;
};

export type ModuleProviderResolveResult = {
  success?: boolean;
  id?: string | null | undefined;
  namespace?: string | null | undefined;
};

export type ModuleProviderLoadContext = {
  id: string;
  namespace: string | undefined;
};

export type ModuleProviderLoadResult = {
  success?: boolean;
  exports?: unknown;
};

export interface ModuleProvider {
  resolve(
    ctx: ModuleProviderResolveContext,
  ): ModuleProviderResolveResult | PromiseLike<ModuleProviderResolveResult>;
  load(
    ctx: ModuleProviderLoadContext,
  ): ModuleProviderLoadResult | PromiseLike<ModuleProviderLoadResult>;
}

export function createModuleProvider(provider: ModuleProvider): ModuleProvider {
  return provider;
}
