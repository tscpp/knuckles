import type { AnalyzerPlugin } from "@knuckles/analyzer";

export interface AnalyzerConfig {
  include?: string | readonly string[] | undefined;
  exclude?: string | readonly string[] | undefined;
  mode?: "strict" | "loose" | undefined;
  plugins?:
    | readonly (
        | AnalyzerPlugin
        | PromiseLike<AnalyzerPlugin>
        | false
        | undefined
        | null
      )[]
    | undefined;
  rules?:
    | Readonly<Record<string, "off" | "on" | "error" | "warning">>
    | undefined;
}

export interface SSRConfig {}

export interface Config {
  attributes?: readonly string[] | undefined;
  analyzer?: AnalyzerConfig | undefined;
  ssr?: SSRConfig | undefined;
}

export interface NormalizedAnalyzerConfig extends AnalyzerConfig {
  include: string | string[] | undefined;
  exclude: string | string[] | undefined;
  mode: "strict" | "loose";
  plugins: AnalyzerPlugin[];
  rules: Record<string, "off" | "on" | "error" | "warning">;
}

export interface NormalizedSSRConfig extends SSRConfig {}

export interface NormalizedConfig extends Config {
  attributes: string[];
  analyzer: NormalizedAnalyzerConfig;
  ssr: NormalizedSSRConfig;
}
