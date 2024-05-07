import builtins from "./_built-ins.js";
import { BindingContext } from "./binding-context.js";
import { type Binding, parseBindings } from "./binding.js";
import {
  type Diagnostic,
  type DiagnosticError,
  type DiagnosticWarning,
  createDiagnostic,
  isDiagnostic,
  toMessage,
} from "./diagnostic.js";
import { evaluateBinding, evaluateInlineData } from "./eval.js";
import type { Plugin, Self, Sibling } from "./plugin.js";
import { getInnerRange } from "./utils.js";
import { type Range } from "@knuckles/location";
import {
  parse,
  formatParse5Error,
  parse5LocationToRange,
} from "@knuckles/parser";
import {
  Element,
  type ParentNode,
  VirtualElement,
  isParentNode,
  DirectiveElement,
  DirectiveKind,
  type WithDirective,
} from "@knuckles/syntax-tree";
import { resolve as importMetaResolve } from "import-meta-resolve";
import ko from "knockout";
import MagicString from "magic-string";
import { pathToFileURL } from "node:url";

export interface CommonOptions {
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
}

export interface RenderOptions extends CommonOptions {
  /**
   * @deprecated Use {@link filename} instead.
   */
  parent?: string | undefined;

  /**
   * The path of the file being processed. Used to resolve relative imports
   * within the document.
   */
  filename?: string | undefined;

  resolve?: (specifier: string) => Promise<string | null>;
}

export interface RenderResult {
  /**
   * The generated document.
   */
  document: string;
  sourceMap: string;

  errors: DiagnosticError[];
  warnings: DiagnosticWarning[];
}

interface RenderBindingResult {
  propagate: boolean | "custom";
  bubble?: (() => Promise<void>) | undefined;
  extend?: (() => Promise<BindingContext>) | undefined;
}

export function render(
  document: string,
  options?: RenderOptions,
): Promise<RenderResult> {
  return new Renderer(document, options).render();
}

type DiagnosticInit = {
  message: string;
  range?: Range;
  code?: string;
  cause?: unknown;
};

class Renderer {
  document: MagicString;
  plugins: Plugin[];
  attributes: string[];
  filename: string | undefined;
  errors: DiagnosticError[] = [];
  warnings: DiagnosticWarning[] = [];
  consumed = false;
  options: RenderOptions;

  constructor(document: string, options?: RenderOptions | undefined) {
    this.document = new MagicString(document, {
      filename: options?.filename,
    });
    this.plugins = [
      ...(options?.useBuiltins !== false ? builtins : []),
      ...(options?.plugins ?? []),
    ];
    this.attributes = options?.attributes ?? ["data-bind"];
    this.filename = options?.filename ?? options?.parent;
    this.options = options ?? {};
  }

  warning(init: DiagnosticInit) {
    return createDiagnostic({
      type: "warning",
      filename: this.filename,
      ...init,
    });
  }

  error(init: DiagnosticInit) {
    return createDiagnostic({
      type: "error",
      filename: this.filename,
      ...init,
    });
  }

  emit(diagnostic: Diagnostic) {
    if (diagnostic.type === "error") {
      this.errors.push(diagnostic);
    } else {
      this.warnings.push(diagnostic);
    }
  }

  fatal(init: DiagnosticInit): never {
    this.emit(this.error(init));
    throw new Error("Unable to render document.");
  }

  catch(
    error: unknown,
    range?: Range,
    unexpected = (error: unknown) => {
      throw error;
    },
  ) {
    if (isDiagnostic(error)) {
      error.range ??= range;
      this.emit(error);
    } else {
      unexpected(error);
    }
  }

  async parse() {
    try {
      return parse(this.document.original, {
        onError: (error) => {
          this.emit(
            this.error({
              code: error.code,
              message: formatParse5Error(error),
              range: parse5LocationToRange(error),
            }),
          );
        },
        bindingAttributes: this.options.attributes,
      });
    } catch (error) {
      throw this.error({
        code: "parse-error",
        message: "Failed to parse document.",
        range: undefined,
      });
    }
  }

  async render(): Promise<RenderResult> {
    if (this.consumed) {
      throw new Error("Renderer has already been consumed.");
    }
    this.consumed = true;

    try {
      const parsed = await this.parse();
      await this.scan(parsed);

      const document = this.document.toString();

      const sourceMap = this.document
        .generateMap({
          source: this.filename,
          includeContent: true,
        })
        .toString();

      return {
        document,
        sourceMap,
        errors: this.errors,
        warnings: this.warnings,
      };
    } catch (error) {
      this.catch(error);
      throw new Error("Unable to render document.");
    }
  }

  async scan(node: ParentNode) {
    if (
      node instanceof DirectiveElement &&
      node.directive.kind === DirectiveKind.With
    ) {
      await this.renderRoot(node, node.directive);
      return;
    }

    for (const child of node.children) {
      if (isParentNode(child)) {
        await this.scan(child);
      }
    }
  }

  async resolve(specifier: string): Promise<string> {
    if (this.options.resolve) {
      const resolved = await this.options.resolve(specifier);
      if (!resolved) {
        throw new Error(
          `Cannot resolve ${specifier}${
            this.filename ? ` from ${this.filename}` : ""
          }.`,
        );
      }
      return pathToFileURL(resolved).toString();
    } else {
      if (!this.filename) {
        throw new Error("Filename is required to resolve imports.");
      }
      const parent = pathToFileURL(this.filename).toString();
      return importMetaResolve(specifier, parent);
    }
  }

  async load(id: string): Promise<unknown> {
    const providers = this.plugins.filter((plugin) => plugin.load);

    if (providers.length > 1) {
      throw new Error("Multiple plugins are providing load hook.");
    }

    if (providers.length === 1) {
      const load = providers[0]!.load!;
      try {
        return load(id);
      } catch (cause) {
        throw this.error({
          code: "cannot-load-module",
          message: toMessage(cause),
          cause,
        });
      }
    } else {
      try {
        return await import(id);
      } catch (cause) {
        throw this.error({
          code: "cannot-load-module",
          message: toMessage(cause),
          cause,
        });
      }
    }
  }

  interop(exports: unknown): unknown {
    const providers = this.plugins.filter((plugin) => plugin.interop);

    if (providers.length > 1) {
      throw new Error("Multiple plugins are providing interop hook.");
    }

    if (providers.length === 1) {
      const interop = providers[0]!.interop!;
      try {
        return interop(exports);
      } catch (cause) {
        throw this.error({
          code: "interop-error",
          message: toMessage(cause),
          cause,
        });
      }
    } else {
      if (typeof exports === "function") {
        return exports();
      } else {
        return exports;
      }
    }
  }

  async loadSsrData(directive: WithDirective) {
    if (directive.import) {
      const resolved = await this.resolve(directive.import.module);
      // TODO: improve error handling
      try {
        const exports = this.interop(await this.load(resolved)) as any;
        return exports[directive.import.specifier];
      } catch (cause) {
        throw this.error({
          code: "cannot-find-module",
          message: toMessage(cause),
          cause,
        });
      }
    } else {
      try {
        return evaluateInlineData(directive.inline);
      } catch (cause) {
        throw this.error({
          code: "invalid-inline-data",
          message: `Invalid inline data: ${toMessage(cause)}`,
          cause,
        });
      }
    }
  }

  async renderRoot(
    node: DirectiveElement,
    directive: WithDirective,
    document = this.document,
  ) {
    try {
      const data = await this.loadSsrData(directive);
      const context = new BindingContext(data);

      // Remove virtual element start and end comments.
      const inner = getInnerRange(node, document.original);
      document.remove(node.range.start.offset, inner.start.offset);
      document.remove(inner.end.offset, node.range.end.offset);

      await this.renderDecendants(node, context);
    } catch (error) {
      this.catch(error, node.range);
    }
  }

  async createChildContext(
    context: BindingContext,
    extend?: (() => Promise<BindingContext>) | undefined,
  ) {
    return extend ? extend() : context.createChildContext(context.$rawData);
  }

  async renderDecendants(
    node: ParentNode,
    context: BindingContext,
    document = this.document,
  ) {
    for (const child of node.children) {
      if (
        child instanceof DirectiveElement &&
        child.directive.kind === DirectiveKind.With
      ) {
        await this.renderRoot(child, child.directive, document);
        continue;
      }

      if (child instanceof VirtualElement || child instanceof Element) {
        await this.renderElement(child, context, document);
        continue;
      }
    }
  }

  async renderElement(
    node: Element | VirtualElement,
    context: BindingContext,
    document = this.document,
  ) {
    try {
      let bindings: Binding[];
      try {
        bindings = parseBindings(node);
      } catch (cause) {
        this.emit(
          this.error({
            code: "binding-parse-error",
            message: "Failed to parse binding expression.",
            range: node.range,
            cause,
          }),
        );
        return;
      }

      const { propagate, bubble, extend } = await this.#renderBindings(
        node,
        bindings,
        context,
        document,
      );

      if (propagate === true) {
        const childContext = await this.createChildContext(context, extend);
        await this.renderDecendants(node, childContext);
      }

      await bubble?.();
    } catch (error) {
      this.catch(error, node.range, () => {
        throw this.error({
          code: "binding-error",
          message: toMessage(error),
          range: node.range,
          cause: error,
        });
      });
    }
  }

  async #renderBindings(
    node: Element | VirtualElement,
    bindings: readonly Binding[],
    context: BindingContext,
    document = this.document,
  ): Promise<RenderBindingResult> {
    const plugins = bindings.map((binding) =>
      this.plugins.find((plugin) => plugin.filter(binding)),
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
          range: binding.range,
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
          rawValue = evaluateBinding(binding.expression, {
            $context: context,
            ...context,
          });
          dirty = false;
        } catch (cause) {
          throw this.error({
            code: "binding-evaluation-error",
            message: toMessage(cause),
            range: binding.range,
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
            const inner = getInnerRange(node, clone.original);
            return clone.slice(...inner.offsets);
          },
        });
      } catch (cause) {
        throw this.catch(cause, bindings[i]!.range, () => {
          throw this.error({
            code: "render-error",
            message: toMessage(cause),
            range: bindings[i]!.range,
            cause,
          });
        });
      }
    }

    const extenders: (() => BindingContext | PromiseLike<BindingContext>)[] =
      [];
    for (const [i, plugin] of plugins.entries()) {
      if (!plugin?.extend) continue;
      let extender: () => BindingContext | PromiseLike<BindingContext>;
      try {
        extender = () => plugin.extend!({ parent: getSelf(i) });
      } catch (cause) {
        throw this.catch(cause, bindings[i]!.range, () => {
          throw this.error({
            code: "extend-error",
            message: toMessage(cause),
            range: bindings[i]!.range,
            cause,
          });
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
}
