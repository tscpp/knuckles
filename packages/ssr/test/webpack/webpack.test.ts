import { test, describe } from "bun:test";
import { resolve } from "node:path";

describe("webpack (build-tool)", () => {
  test.only(
    "webpack",
    async () => {
      const subprocess = Bun.spawn(
        ["node", "--test", resolve(import.meta.dir, "./prepare.cjs")],
        {
          stdio: ["inherit", "inherit", "inherit"],
        },
      );
      await subprocess.exited;

      if (subprocess.exitCode !== 0) {
        throw new Error(`Process exited with code ${subprocess.exitCode}.`);
      }
    },
    { timeout: 10_000 },
  );
});
