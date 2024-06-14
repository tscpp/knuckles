import logger, {
  LogConsoleWriter,
  LogFileWriter,
  LogFormatter,
  LogLevel,
  LogUncolorize,
  logLevels,
  toLogLevel,
} from "./logger.js";
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
        choices: logLevels,
        description: "Log level for the console.",
      },
    })
    .middleware((args) => {
      // Setup logger

      const logLevel = toLogLevel(
        args.logLevel || (args.verbose && "verbose") || "info",
      );

      // Pipe logger to console
      logger //
        .createReadableStream()
        .pipeThrough(new LogFormatter({ colorize: true }))
        .pipeTo(new LogConsoleWriter(logLevel));

      // Pipe logger to debug log
      if (args.debug) {
        logger
          .createReadableStream()
          .pipeThrough(new LogUncolorize())
          .pipeThrough(new LogFormatter({ colorize: false }))
          .pipeTo(new LogFileWriter("ko.debug.log", LogLevel.Debug));
      }

      logger.debug(`Log level: ${LogLevel[logLevel]}`);
      logger.debug(`CWD: ${process.cwd()}`);
    })
    .demandCommand();
