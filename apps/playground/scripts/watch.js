import config from "../esbuild.config.js";
import * as esbuild from "esbuild";

for (const options of config) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
}
