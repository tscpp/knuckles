import command from "../../command.js";
import { $ } from "execa";
import type { PathLike } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const recipes: Record<string, string[]> = {
  analyzer: ["@knuckles/analyzer", "@knuckles/config"],
  typescript: [
    "@knuckles/analyzer",
    "@knuckles/config",
    "@knuckles/typescript",
    "typescript",
  ],
  eslint: [
    "@knuckles/analyzer",
    "@knuckles/config",
    "@knuckles/eslint",
    "eslint",
  ],
  ssr: ["@knuckles/ssr", "@knuckles/config"],
};

export default command({
  command: "add <recipe>",
  builder: (yargs) =>
    yargs
      .positional("recipe", {
        type: "string",
        demandOption: true,
      })
      .options({
        pm: {
          type: "string",
        },
      }),
  handler: async (args) => {
    const pm =
      (args.pm as PackageManager | undefined) ?? (await detectPackageManager());

    const recipe = recipes[args.recipe];

    if (!recipe) {
      console.error(`Recipe "${args.recipe}" does not exist.`);
      process.exit(1);
    }

    await install(recipe, pm);
  },
});

async function install(packages: string[], pm: PackageManager) {
  const packageJsonPath = await findPackageJson();
  if (!packageJsonPath) {
    console.error('Unable to find "package.json".');
    process.exit(1);
  }

  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
  packages = packages.filter(
    (name) =>
      !(
        packageJson.dependencies?.[name] || packageJson.devDependencies?.[name]
      ),
  );

  switch (pm) {
    case "bun":
      await $`bun add --save-dev ${packages}`;
      break;

    case "pnpm":
      await $`pnpm add --save-dev ${packages}`;
      break;

    case "yarn":
      await $`yarn add --dev ${packages}`;
      break;

    case "npm":
      await $`npm install --save-dev ${packages}`;
      break;

    default:
      console.error(
        `Installing packages with package manager "${pm}" is not supported.`,
      );
      process.exit(1);
  }
}

async function findPackageJson(
  cwd = process.cwd(),
): Promise<string | undefined> {
  const path = join(cwd, "package.json");

  if (await exists(path)) {
    return path;
  } else {
    const parent = resolve(cwd, "..");

    if (parent !== cwd) {
      return await findPackageJson(parent);
    } else {
      return undefined;
    }
  }
}

type PackageManager = "pnpm" | "bun" | "yarn" | "npm";

async function detectPackageManager(
  cwd = process.cwd(),
): Promise<PackageManager> {
  const lockFileKinds: Record<string, PackageManager> = {
    "bun.lockb": "bun",
    "pnpm-lock.yaml": "pnpm",
    "yarn.lock": "yarn",
    "package-lock.json": "npm",
  };

  for (const [fileName, packageManager] of Object.entries(lockFileKinds)) {
    if (await exists(join(cwd, fileName))) {
      return packageManager;
    }
  }

  const parent = resolve(cwd, "..");
  if (parent !== cwd) {
    return await detectPackageManager(parent);
  }

  return "npm";
}

async function exists(path: PathLike): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    } else {
      throw error;
    }
  }
}
