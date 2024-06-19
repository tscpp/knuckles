import { BindingContext } from "./binding-context.js";
import bindings from "./bindings.js";
import {
  type DiagnosticError,
  type DiagnosticWarning,
  createDiagnostic,
  isDiagnostic,
  toMessage,
} from "./diagnostic.js";
import { evaluate } from "./evaluate.js";
import type {
  ModuleProvider,
  ModuleProviderLoadResult,
  ModuleProviderResolveResult,
} from "./module-provider.js";
import type { Plugin, Self, Sibling } from "./plugin.js";
import { Position, Range } from "@knuckles/location";
import { parse } from "@knuckles/parser";
import {
  Element,
  ParentNode,
  WithVirtualElement,
  type StringLiteral,
  type ImportStatement,
  KoVirtualElement,
  VirtualElement,
  type Node,
} from "@knuckles/syntax-tree";
import ko from "knockout";
import MagicString from "magic-string";

export interface RendererOptions {
  /**
   * Custom plugins to use.
   */
  plugins?: Plugin[] | undefined;

  /**
   * Whether to use the built-in plugins for standard knockout bindings.
   *
   * @default true
   */
  useBuiltins?: boolean | undefined;

  /**
   * The attributes to scan for bindings.
   *
   * @default ["data-bind"]
   */
  attributes?: string[] | undefined;

  /**
   * Whether to fail when a binding fails to evaluate or render. By default,
   * errors will be emitted without failing.
   *
   * @default false
   */
  strict?: boolean | undefined;

  fallback?: boolean | undefined;

  preserveHints?: boolean | undefined;

  module?: ModuleProvider;
}

export class Renderer {
  readonly modified: MagicString;
  #plugins: Plugin[];
  #options: RendererOptions;

  readonly errors: DiagnosticError[] = [];
  readonly warnings: DiagnosticWarning[] = [];

  constructor(text: string, options: RendererOptions | undefined = {}) {
    this.#options = options;
    this.modified = new MagicString(text);
    this.#plugins = [
      ...(options?.useBuiltins !== false ? bindings : []),
      ...(options?.plugins ?? []),
    ];
  }

  //#region Helpers
  warning(init: {
    message: string;
    range?: Range;
    code?: string;
    cause?: unknown;
  }) {
    const warning = createDiagnostic({
      type: "warning",
      ...init,
    });
    this.warnings.push(warning);
    return warning;
  }

  error(init: {
    message: string;
    range?: Range;
    code?: string;
    cause?: unknown;
  }) {
    const error = createDiagnostic({
      type: "error",
      ...init,
    });
    this.errors.push(error);
    return error;
  }

  async createChildContext(
    context: BindingContext,
    extend?: (() => Promise<BindingContext>) | undefined,
  ) {
    return extend ? extend() : context.createChildContext(context.$rawData);
  }
  //#endregion

  //#region Modules
  async resolve(module: StringLiteral) {
    if (!this.#options.module) {
      throw new Error(`Module provider is not defined.`);
    }

    let result: ModuleProviderResolveResult;
    try {
      result = await this.#options.module.resolve({
        specifier: module.value,
      });
    } catch (error) {
      if (isDiagnostic(error)) {
        throw error;
      } else {
        throw this.error({
          code: "module-resolution",
          message: toMessage(error),
          range: module,
          cause: error,
        });
      }
    }

    if (result.success === false || !result.id) {
      throw this.error({
        code: "module-resolution",
        message: "Failed to resolve module.",
        range: module,
      });
    }

    return {
      id: result.id,
      namespace: result.namespace ?? undefined,
    };
  }

  async load(module: StringLiteral) {
    const resolved = await this.resolve(module);

    let result: ModuleProviderLoadResult;
    try {
      result = await this.#options.module!.load({
        id: resolved.id!,
        namespace: resolved.namespace,
      });
    } catch (error) {
      if (isDiagnostic(error)) {
        throw error;
      } else {
        throw this.error({
          code: "module-load",
          message: toMessage(error),
          range: module,
          cause: error,
        });
      }
    }

    if (result.success === false || !result.exports) {
      throw this.error({
        code: "module-load",
        message: "Failed to load module.",
        range: module,
      });
    }

    return result.exports;
  }

  async import(statement: ImportStatement) {
    const exports = await this.load(statement.module);

    if (statement.identifier.value === "*") {
      return exports;
    } else if (
      typeof exports === "object" &&
      statement.identifier.value in exports
    ) {
      type Exports = { [K in typeof statement.identifier.value]: unknown };
      return (exports as Exports)[statement.identifier.value];
    } else {
      throw this.error({
        code: "module-import",
        message: `Module does not export identifier '${statement.identifier.value}'.`,
        range: statement.identifier,
      });
    }
  }
  //#endregion

  //#region Scanning
  async parse() {
    const result = parse(this.modified.original, {
      bindingAttributes: this.#options.attributes,
    });

    if (!result.document) {
      this.errors.push(
        ...result.errors.map((error) =>
          createDiagnostic({
            type: "error",
            message: error.description,
            range: new Range(
              error.start,
              error.end ??
                Position.translate(error.start, 1, this.modified.original),
            ),
            cause: error,
          }),
        ),
      );
    }

    return result.document;
  }

  async render(): Promise<boolean> {
    const document = await this.parse();
    if (!document) return false;

    try {
      await this.scan(document);
    } catch (error) {
      if (isDiagnostic(error)) {
        return false;
      } else {
        throw error;
      }
    }

    return true;
  }

  isSsrVirtualElement(node: Node) {
    return (
      node instanceof VirtualElement &&
      (node.name.value === "ssr" || node.name.value === "no-ssr")
    );
  }

  isSsrEnabled(node: Node, fallback = true) {
    if (node instanceof VirtualElement) {
      if (node.name.value === "ssr" && node.param.value === "true") {
        return true;
      }

      if (node.name.value === "no-ssr" && node.param.value === "false") {
        return true;
      }
    }

    return fallback;
  }

  async scan(node: ParentNode) {
    if (this.isSsrEnabled(node, this.#options.fallback ?? false)) {
      // If ssr is enabled, render the decendants.
      const context = new BindingContext({});
      await this.renderDecendants(node, context);
    } else {
      // Continue to scan decendants
      for (const child of node.children) {
        if (child instanceof ParentNode) {
          await this.scan(child);
        }
      }
    }
  }

  async renderViewModel(modified: MagicString, node: WithVirtualElement) {
    const data = await this.import(node.import);
    const context = new BindingContext(data);

    if (!this.#options.preserveHints) {
      // Remove virtual element start and end comments.
      modified.remove(node.start.offset, node.inner.start.offset);
      modified.remove(node.inner.end.offset, node.end.offset);
    }

    await this.renderDecendants(node, context);
  }

  async renderDecendants(
    node: ParentNode,
    context: BindingContext,
    modified = this.modified,
  ) {
    for (const child of node.children) {
      if (this.isSsrEnabled(child, true)) {
        if (child instanceof WithVirtualElement) {
          await this.renderViewModel(modified, child);
          continue;
        }

        if (child instanceof ParentNode) {
          await this.renderParent(child, context, modified);
          continue;
        }
      }
    }
  }

  async renderParent(
    node: ParentNode,
    context: BindingContext,
    document = this.modified,
  ) {
    if (node instanceof Element || node instanceof KoVirtualElement) {
      const { propagate, bubble, extend } = await this.#renderBindings(
        node,
        context,
        document,
      );

      if (propagate === true) {
        const childContext = await this.createChildContext(context, extend);
        await this.renderDecendants(node, childContext);
      }

      await bubble?.();
    } else {
      await this.renderDecendants(node, context);
    }
  }
  //#endregion

  //#region Rendering
  async #renderBindings(
    node: Element | KoVirtualElement,
    context: BindingContext,
    document = this.modified,
  ): Promise<{
    propagate: boolean | "custom";
    bubble?: (() => Promise<void>) | undefined;
    extend?: (() => Promise<BindingContext>) | undefined;
  }> {
    const bindings = node instanceof Element ? node.bindings : [node.binding];

    const plugins = bindings.map((binding) =>
      this.#plugins.find((plugin) => plugin.filter(binding)),
    );

    for (let i = 0; i < bindings.length; ++i) {
      const binding = bindings[i]!;
      const plugin = plugins[i];

      try {
        await plugin?.alter?.({
          binding,
          context,
        });
      } catch (cause) {
        throw this.error({
          code: "alter-error",
          message: toMessage(cause),
          range: binding,
          cause,
        });
      }
    }

    const rawValues: (() => unknown)[] = [];
    for (const binding of bindings) {
      let rawValue: unknown;
      let dirty = true;
      rawValues.push(() => {
        if (!dirty) return rawValue;
        try {
          rawValue = evaluate(binding.param.value, context);
          dirty = false;
        } catch (cause) {
          throw this.error({
            code: "binding-evaluation-error",
            message: toMessage(cause),
            range: binding,
            cause,
          });
        }
        return rawValue;
      });
    }

    const values = rawValues.map((rawValue) => () => ko.unwrap(rawValue()));

    const bubbles: (() => void | PromiseLike<void>)[] = [];

    const getSibling = (index: number): Sibling => {
      return {
        binding: bindings[index]!,
        context,
        value: values[index]!,
        rawValue: rawValues[index]!,
      };
    };

    const getSelf = (index: number): Self => {
      return {
        ...getSibling(index),
        siblings: bindings.map((_, i) => getSibling(i)),
      };
    };

    const propagate = plugins
      .map((plugin, i) => {
        if (plugin?.propagate === undefined) return true;

        if (typeof plugin.propagate === "function") {
          return plugin.propagate(getSelf(i));
        } else {
          return plugin.propagate;
        }
      })
      .reduce(
        (a, b) => (a === "custom" || b === "custom" ? "custom" : a && b),
        true,
      );

    for (let i = 0; i < bindings.length; ++i) {
      const binding = bindings[i]!;
      const self = getSelf(i);
      const plugin = plugins[i];

      try {
        await plugin?.ssr?.({
          ...self,
          generated: document,
          bubble: (callback) => {
            bubbles.push(callback);
          },
          propagate,
          renderFragment: async (childContext) => {
            const clone = document.clone();
            this.renderDecendants(node, childContext, clone);
            return clone.slice(...node.inner.offsets);
          },
        });
      } catch (cause) {
        throw this.error({
          code: "render-error",
          message: toMessage(cause),
          range: binding,
          cause,
        });
      }
    }

    const extenders: (() => BindingContext | PromiseLike<BindingContext>)[] =
      [];
    for (const [i, plugin] of plugins.entries()) {
      const binding = bindings[i]!;
      if (!plugin?.extend) continue;
      let extender: () => BindingContext | PromiseLike<BindingContext>;
      try {
        extender = () => plugin.extend!({ parent: getSelf(i) });
      } catch (cause) {
        throw this.error({
          code: "extend-error",
          message: toMessage(cause),
          range: binding,
          cause,
        });
      }
      extenders.push(extender);
    }

    // Only one plugin is expected to provide an extender.
    // See `extendDecendants`.
    if (extenders.length > 1) {
      console.warn("Multiple plugins is extending the binding context.");
    }

    const extend =
      extenders.length > 0
        ? async () => {
            const contexts = await Promise.all(
              extenders.map((extend) => extend()),
            );
            return contexts.length === 1
              ? contexts[0]!
              : contexts.reduce((a, b) => a.extend(b));
          }
        : undefined;

    const bubble = async () => {
      for (const bubble of bubbles) {
        await bubble();
      }
    };

    return {
      propagate,
      bubble,
      extend,
    };
  }
  //#endregion
}
