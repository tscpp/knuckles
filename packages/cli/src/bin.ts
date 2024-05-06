#!/usr/bin/env node

/* eslint-disable @typescript-eslint/consistent-type-imports */
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

// Run the cli. Local installation is preferred.
const module = await importModule();
await module.default(process.argv.slice(2));

/**
 * Imports the cli module somehow. The local installation is preferred if it
 * exists.
 */
async function importModule() {
  let module: typeof import("./index.js");

  const localModule = resolveLocalModule();

  if (localModule) {
    module = (await import(localModule)) as typeof import("./index.js");
  } else {
    module = await import("./index.js");
  }

  return module;
}

/**
 * Tries to resolve the local installation of the module if it exists.
 */
function resolveLocalModule() {
  const require = createRequire(import.meta.url);

  let localModulePath: string | undefined;
  try {
    localModulePath = require.resolve("@knuckles/cli", {
      paths: [process.cwd()],
    });
  } catch {}

  if (localModulePath) {
    return pathToFileURL(localModulePath).toString();
  } else {
    return null;
  }
}
