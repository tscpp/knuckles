import config from "../esbuild.config.js";
import * as esbuild from "esbuild";

await esbuild.build(config);
