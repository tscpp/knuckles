import config from "../esbuild.config.js";
import * as esbuild from "esbuild";

for (const options of config) {
  await esbuild.build(options);
}
