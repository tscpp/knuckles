import logger, { createDebugFile, levels } from "./logger.js";
import yargs from "yargs";

export default (argv: readonly string[], cwd: string) =>
  yargs(argv, cwd) //
    .strict()
    .scriptName("ko")
    .usage("$0 <cmd> [args]")
    .options({
      debug: {
        type: "boolean",
        default: false,
        description: "Prints debug info to ko.debug.log.",
      },
      verbose: {
        type: "boolean",
        default: false,
        description: "Output verbose info to console.",
      },
      logLevel: {
        type: "string",
        choices: Object.keys(levels),
        description: "Log level for the console.",
      },
    })
    .middleware((args) => {
      // Setup logger
      logger.level = args.logLevel || (args.verbose && "verbose") || "info";
      if (args.debug) {
        logger.add(createDebugFile());
      }
      logger.debug(`Log level: ${logger.level}`);
      logger.debug(`CWD: ${process.cwd()}`);
    })
    .demandCommand();
