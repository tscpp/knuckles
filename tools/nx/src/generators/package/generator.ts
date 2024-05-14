import { type PackageGeneratorSchema } from "./schema.js";
import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  type Generator,
  type Tree,
} from "@nx/devkit";
import * as path from "path";

const generator: Generator<PackageGeneratorSchema> = async (
  tree: Tree,
  options,
) => {
  const directory = options.type === "development" ? "tools" : "packages";
  const scope = options.type === "development" ? "@tools" : "@knuckles";
  const projectRoot = `${directory}/${options.name}`;
  const name = `${scope}/${options.name}`;
  addProjectConfiguration(tree, name, {
    root: projectRoot,
    projectType: "library",
    sourceRoot: `{projectRoot}/src`,
    targets: {
      build: {},
      test: {},
      lint: {},
    },
  });
  generateFiles(tree, path.join(__dirname, "files"), projectRoot, {
    name,
  });
  await formatFiles(tree);
};

export default generator;
