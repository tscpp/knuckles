/* eslint-disable */
import { ns, quote, rmnl } from "./utils.js";
import { Chunk, type ChunkLike } from "@knuckles/fabricator";
import type { Position } from "@knuckles/location";
import type { Document } from "@knuckles/syntax-tree";
import * as ko from "@knuckles/syntax-tree";
import * as ts from "ts-morph";

export interface TranspilerOptions {
  tsConfig?: string | ts.CompilerOptions;
  fileSystem?: ts.FileSystemHost | undefined;
  strictness?: TranspilerStrictness;
}

const defaultCompilerOptions: ts.CompilerOptions = {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2016,
  strict: true,
  esModuleInterop: true,
  forceConsistentCasingInFileNames: true,
  skipLibCheck: true,
};

export type TranspilerOutput = {
  chunk: Chunk;
  sourceFile: ts.SourceFile;
};

export type TranspilerStrictness = "strict" | "loose";

export class TranspilerError extends Error {
  constructor(
    message: string,
    public start?: Position,
    public end?: Position,
  ) {
    super(message);
  }
}

export class Transpiler {
  readonly project: ts.Project;
  #strictness: TranspilerStrictness;

  constructor(options?: TranspilerOptions) {
    this.project = new ts.Project({
      ...(typeof options?.tsConfig === "string"
        ? { tsConfigFilePath: options.tsConfig }
        : options?.tsConfig ?? defaultCompilerOptions),
      skipAddingFilesFromTsConfig: true,
      fileSystem: options?.fileSystem,
    });
    this.#strictness = options?.strictness ?? "loose";
  }

  transpile(fileName: string, syntaxTree: Document): TranspilerOutput {
    const renderer = new Renderer(fileName, this.project, this.#strictness);
    renderer.refresh();
    const chunk = renderer.render(syntaxTree);
    const sourceFile = renderer.enhance(chunk);
    return {
      chunk,
      sourceFile,
    };
  }
}

type BindingDeclarationMetadata = {
  requiresContextParamater: boolean;
  returnsChildContext: boolean;
};

class Renderer {
  #bindingMetadataMap!: Map<string, BindingDeclarationMetadata>;

  get #unknown() {
    return this.strictness === "strict" ? "unknown" : "any";
  }

  constructor(
    private fileName: string,
    private project: ts.Project,
    private strictness: TranspilerStrictness,
  ) {}

  #createSourceFile(text?: string | undefined) {
    return this.project.createSourceFile(this.fileName + ".ts", text, {
      overwrite: true,
    });
  }

  refresh() {
    const sourceFiles = this.project.getSourceFiles();
    for (const sourceFile of sourceFiles) {
      sourceFile.refreshFromFileSystemSync();
    }

    const sourceFile = this.#createSourceFile();

    const importDeclaration = sourceFile.addImportDeclaration({
      moduleSpecifier: "@knuckles/typescript/types",
      defaultImport: ns,
    });
    this.project.resolveSourceFileDependencies();
    const [typesSourceFile] = sourceFile.getReferencedSourceFiles();
    if (!typesSourceFile) {
      throw new TranspilerError(
        'Cannot find module "@knuckles/typescript/types". Is "@knuckles/typescript" installed?',
      );
    }

    const assertOrBroken: (condition: unknown) => asserts condition = (
      condition,
    ) => {
      if (!condition) {
        throw new TranspilerError(
          'Module "@knuckles/typescript" seems to be broken or outdated. Try installing the latest version.',
        );
      }
    };

    const knucklesNs = getDescendantOfKind(
      typesSourceFile,
      ts.SyntaxKind.ModuleDeclaration,
      "Knuckles",
    );
    assertOrBroken(knucklesNs);

    const traitsNs = getDescendantOfKind(
      typesSourceFile,
      ts.SyntaxKind.ModuleDeclaration,
      "Traits",
    );
    assertOrBroken(traitsNs);

    const returnsChildContextTrait = getDescendantOfKind(
      traitsNs,
      ts.SyntaxKind.TypeAliasDeclaration,
      "ReturnsChildContext",
    );
    assertOrBroken(returnsChildContextTrait);

    const requiresContextParamaterTrait = getDescendantOfKind(
      traitsNs,
      ts.SyntaxKind.TypeAliasDeclaration,
      "RequiresContextParamater",
    );
    assertOrBroken(requiresContextParamaterTrait);

    const strictnessNs = getDescendantOfKind(
      knucklesNs,
      ts.SyntaxKind.ModuleDeclaration,
      this.strictness === "strict" ? "Strict" : "Loose",
    );
    assertOrBroken(strictnessNs);

    const bindingsType = getDescendantOfKind(
      strictnessNs,
      ts.SyntaxKind.InterfaceDeclaration,
      "Bindings",
    );
    assertOrBroken(bindingsType);

    this.#bindingMetadataMap = new Map(
      bindingsType
        .getType()
        .getProperties()
        .map((property): [string, BindingDeclarationMetadata] => {
          const name = property.getName();
          const type = property.getValueDeclarationOrThrow().getType();
          const requiresContextParamater = type.isAssignableTo(
            requiresContextParamaterTrait.getType(),
          );
          const returnsChildContext = type.isAssignableTo(
            returnsChildContextTrait.getType(),
          );

          return [
            name,
            {
              requiresContextParamater,
              returnsChildContext,
            },
          ];
        }),
    );

    importDeclaration.remove();
  }

  render(document: Document) {
    return new Chunk()
      .append(`import ${ns} from '@knuckles/typescript/types';`)
      .newline(2)
      .append("declare const $context: {")
      .newline()
      .append("$parentContext: undefined;")
      .newline()
      .append(`$parents: ${this.#unknown}[];`)
      .newline()
      .append(`$parent: ${this.#unknown};`)
      .newline()
      .append(`$root: ${this.#unknown};`)
      .newline()
      .append(`$data: ${this.#unknown};`)
      .newline()
      .append(`$rawData: ${this.#unknown};`)
      .newline()
      .append("};")
      .newline(2)
      .append(this.#renderNodes(document.children));
  }

  enhance(chunk: Chunk) {
    const sourceFile = this.#createSourceFile(chunk.text());
    this.project.resolveSourceFileDependencies();

    const insert = (offset: number, text: string) => {
      chunk.insert(offset, text);
      sourceFile.insertText(offset, text);
    };

    // Render destructured paramaters for $context and $data.
    for (const marker of chunk.markers(["context", "data"])) {
      const pos = marker.capture(chunk.text());

      const declaration = sourceFile
        .getDescendantAtPos(pos.offset)
        ?.getParent()
        ?.getParent();
      if (
        !declaration ||
        !declaration.isKind(ts.SyntaxKind.VariableDeclaration)
      ) {
        throw new Error(`Unable to get context declaration.`);
      }

      const initializer = declaration.getInitializerOrThrow();
      const type = initializer.getType();
      const destructured = type
        .getProperties()
        .filter((symbol) => !isPrivateMember(symbol))
        .map((symbol) => symbol.getName())
        .join(", ");

      insert(pos.offset, " " + destructured + " ");
    }

    incrementSourceFile(sourceFile);

    return sourceFile;
  }

  #renderNodes(nodes: readonly ko.Node[]): Chunk[] {
    return nodes
      .map((node) => this.#renderNode(node))
      .filter((value): value is Exclude<typeof value, undefined> => !!value);
  }

  #renderNode(node: ko.Node): Chunk | undefined {
    if (node instanceof ko.Element || node instanceof ko.VirtualElement) {
      if (node instanceof ko.Element) {
        return this.#renderElement(node);
      }

      if (node instanceof ko.KoVirtualElement) {
        return this.#renderKoVirtualElement(node);
      }

      if (node instanceof ko.WithVirtualElement) {
        return this.#renderWithVirtualElement(node);
      }
    }

    return undefined;
  }

  #isConditional(binding: ko.Binding) {
    return ["if", "ifnot"].includes(binding.name.value);
  }

  #renderWithVirtualElement(node: ko.WithVirtualElement): Chunk {
    const childContext = new Chunk()
      .append(`${ns}.hints.with(${ns}.type<typeof import(`)
      .append(quote(node.import.module.value))
      .append(")")
      .append(
        node.import.identifier.value === "*"
          ? ""
          : "[" + quote(node.import.identifier.value) + "]",
      )
      .append(">(), $context)");

    return this.#renderClosure(this.#renderNodes(node.children), childContext);
  }

  #renderKoVirtualElement(node: ko.KoVirtualElement): Chunk {
    return this.#renderParent([node.binding], node.children);
  }

  #renderElement(node: ko.Element): Chunk {
    return this.#renderParent(node.bindings, node.children);
  }

  #renderParent(bindings: ko.Binding[], children: ko.Node[]) {
    const normal: ko.Binding[] = [];
    const controls: ko.Binding[] = [];
    const conditional: ko.Binding[] = [];

    for (const binding of bindings) {
      const meta = this.#bindingMetadataMap.get(binding.name.value);

      if (this.#isConditional(binding)) {
        conditional.push(binding);
      } else if (meta?.returnsChildContext) {
        controls.push(binding);
      } else {
        normal.push(binding);
      }
    }

    let descendants: ChunkLike;

    if (controls.length) {
      // Render child binding context creation.
      let childContext: ChunkLike | undefined;
      for (const binding of controls) {
        if (childContext) {
          childContext = this.#renderClosure(
            new Chunk()
              .append(this.#renderBindingComment(binding))
              .newline()
              .append("return ")
              .append(this.#renderBinding(binding))
              .append(";"),
            childContext,
          );
        } else {
          childContext = new Chunk()
            .append(this.#renderBindingComment(binding))
            .newline()
            .append(this.#renderBinding(binding));
        }
      }

      descendants = new Chunk()
        .append(this.#renderClosure(this.#renderNodes(children), childContext!))
        .newline();
    } else {
      descendants = this.#renderNodes(children);
    }

    for (const binding of conditional) {
      const negate = binding.name.value === "ifnot";

      descendants = new Chunk()
        .append("if (")
        .append(negate ? "!(" : "")
        .append(binding.param.value, { blame: binding.param })
        .append(negate ? ")" : "")
        .append(") {")
        .newline()
        .append(descendants)
        .newline()
        .append("}")
        .newline();
    }

    return new Chunk() //
      .append(this.#renderBindings(normal))
      .append(descendants);
  }

  #renderClosure(descendants: ChunkLike, context: ChunkLike) {
    return new Chunk() //
      .append("(($context) => {")
      .newline()
      .append(this.#renderContextDeconstruction())
      .newline()
      .append(descendants)
      .newline()
      .append("})(")
      .append(context)
      .append(")");
  }

  #renderBindingComment(binding: ko.Binding) {
    return new Chunk().append(
      `// "${rmnl(binding.name.value)}: ${rmnl(binding.param.value)}" (${binding.start.format()})`,
    );
  }

  #renderMemberAccess(identifier: ko.Identifier) {
    if (/^[a-z$_][a-z$_0-9]*$/i.test(identifier.value)) {
      return new Chunk() //
        .append(".")
        .append(identifier.value, { mirror: identifier });
    } else {
      return new Chunk() //
        .append("[")
        .append(identifier.value, { mirror: identifier })
        .append("]");
    }
  }

  #renderBindingParent(node: ko.Element | ko.VirtualElement) {
    if (node instanceof ko.Element) {
      return new Chunk()
        .append(`${ns}.element("`)
        .append(node.tagName.value, {
          mirror: node.tagName,
        })
        .append('")');
    } else {
      return new Chunk() //
        .append(`${ns}.comment()`);
    }
  }

  #renderBinding(binding: ko.Binding) {
    const meta = this.#bindingMetadataMap.get(binding.name.value);

    const chunk = new Chunk() //
      .append(ns)
      .append(".")
      .append(this.strictness)
      .append(this.#renderMemberAccess(binding.name))
      .append("(")
      .append(this.#renderBindingParent(binding.parent))
      .append(", ")
      .append(binding.param.value, { mirror: binding.param });

    if (meta?.requiresContextParamater) {
      chunk.append(", $context");
    }

    return chunk.append(")");
  }

  #renderBindings(bindings: ko.Binding[]) {
    return new Chunk().append(
      bindings.map((binding) =>
        new Chunk()
          .append(this.#renderBindingComment(binding))
          .newline()
          .append(this.#renderBinding(binding))
          .append(";")
          .newline(),
      ),
    );
  }

  #renderContextDeconstruction() {
    return new Chunk()
      .append("const ")
      .append("{")
      .marker("context")
      .append("}")
      .append(" = $context;")
      .newline()
      .append("const ")
      .append("{")
      .marker("data")
      .append("}")
      .append(" = $context.$data;");
  }
}

// Add more types when needed :)
type SyntaxKindWithName =
  | ts.SyntaxKind.ModuleDeclaration
  | ts.SyntaxKind.TypeAliasDeclaration
  | ts.SyntaxKind.InterfaceDeclaration;

function getDescendantOfKind(
  node: ts.Node,
  kind: SyntaxKindWithName,
  name: string,
) {
  return node
    .getDescendantsOfKind(kind)
    .find((node) => node.getName() === name);
}

/**
 * Increments the provided source file's version.
 */
function incrementSourceFile(sourceFile: ts.SourceFile) {
  const project = sourceFile.getProject();

  // https://github.com/dsherret/ts-morph/blob/886ad6/packages/common/src/compiler/DocumentRegistry.ts#L29
  (
    project as any
  )._context.compilerFactory.documentRegistry.createOrUpdateSourceFile(
    sourceFile.getFilePath(),
    project.getCompilerOptions(),
    ts.ts.ScriptSnapshot.fromString(sourceFile.getFullText()),
  );
}

function isPrivateMember(symbol: ts.Symbol) {
  const declarations = symbol.getDeclarations();
  for (const declaration of declarations) {
    const kind = declaration.getKind();
    if (
      kind === ts.SyntaxKind.PropertyDeclaration ||
      kind === ts.SyntaxKind.MethodDeclaration
    ) {
      const modifierFlags = declaration.getCombinedModifierFlags();
      if (
        modifierFlags & ts.ts.ModifierFlags.Private ||
        modifierFlags & ts.ts.ModifierFlags.Protected
      ) {
        return true;
      }
    }
  }
  return false;
}
