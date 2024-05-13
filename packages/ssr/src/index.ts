import * as helpers from "./helpers.js";

export {
  BindingContext,
  type BindingContextOptions,
  type ChildContextOptions,
} from "./binding-context.js";
export { default as bindings } from "./bindings.js";
export {
  type Diagnostic,
  type DiagnosticError,
  type DiagnosticWarning,
} from "./diagnostic.js";
export * from "./evaluate.js";
export * from "./module-provider.js";
export * from "./plugin.js";
export * from "./render.js";

/**
 * @deprecated Renamed. Use {@link helpers} instead.
 */
export const utils = helpers;
export { helpers };
