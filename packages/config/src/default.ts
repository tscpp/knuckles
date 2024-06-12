import type { NormalizedConfig } from "./declaration.js";

export const defaultConfig: NormalizedConfig = {
  attributes: ["data-bind"],
  analyzer: {
    include: undefined,
    exclude: undefined,
    strictness: "loose",
    plugins: [],
    rules: {},
  },
  ssr: {},
};
