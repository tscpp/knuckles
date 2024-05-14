import config from "../esbuild.config.js";
import * as esbuild from "esbuild";

for (const options of config) {
  const result = await esbuild.build(options);
  esbuild.formatMessagesSync(result.errors, { kind: "error" });
  esbuild.formatMessagesSync(result.warnings, { kind: "warning" });
}
