import command from "../../command.js";
import { render } from "@knuckles/ssr";
import { resolve as importMetaResolve } from "import-meta-resolve";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import prettier from "prettier";

export default command({
  command: ["render", "ssr"],
  builder: (yargs) =>
    yargs
      .option("input", {
        alias: "i",
        type: "string",
        description: "Path to the input document",
        demandOption: true,
      })

      .option("outdir", {
        alias: "o",
        type: "string",
        description: "Output directory",
        default: ".",
      })
      .option("pretty", {
        type: "boolean",
        description: "Format output with prettier",
        default: true,
      })

      .option("plugin", {
        type: "array",
        description: "Relative path to a plugin module to load",
        default: [] as string[],
      })
      .option("attribute", {
        type: "array",
        description: "Attributes to scan for bindings",
        default: ["data-bind"],
      })
      .option("no-builtins", {
        type: "boolean",
        description: "Disable built-in plugins",
        default: false,
      }),
  handler: async (args) => {
    const document = await readFile(args.input, "utf-8");
    const useBuiltins = !args["no-builtins"];
    const plugins = args.plugin
      .filter((path) => String(path))
      .map((path) => String(path))
      .map(
        (path) =>
          import(
            importMetaResolve(path, pathToFileURL(process.cwd()).toString())
          ),
      )
      .map((exports) => ("default" in exports ? exports.default : exports))
      .map((exports) => (typeof exports === "function" ? exports() : exports));
    const attributes = args.attribute
      .filter((path) => String(path))
      .map((attr) => String(attr));
    const filename = basename(args.input);
    const path = resolve(args.input);

    let { document: generated } = await render(document, {
      plugins,
      useBuiltins,
      attributes,
      filename: path,
    });

    if (args.pretty) {
      generated = await prettier.format(generated, {
        parser: "html",
      });
    }

    const outdir = args.outdir ?? dirname(args.input);
    await mkdir(outdir, { recursive: true });
    await writeFile(resolve(outdir, filename), generated);
  },
});
