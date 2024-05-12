import { spawn } from "node:child_process";

const subprocess = spawn("pnpm", ["serve", "public"], { stdio: "inherit" });
subprocess.on("exit", (code) => {
  throw new Error(`Process exited with code ${code}.`);
});
