import { Chalk, supportsColor } from "chalk";
import { appendFileSync, closeSync, openSync, type PathLike } from "node:fs";
import {
  ReadableStream,
  WritableStream,
  type QueuingStrategy,
  type ReadableStreamController,
  type ReadableWritablePair,
} from "node:stream/web";
import { inspect } from "node:util";
import stripAnsi from "strip-ansi";

export enum LogLevel {
  Silent = 0,
  Error,
  Warning,
  Info,
  Verbose,
  Debug,
}

export type LogLevelLike = string | LogLevel;

export const logLevels = [
  "silent",
  "error",
  "warn",
  "info",
  "verbose",
  "debug",
] satisfies LogLevelLike[];

export function toLogLevel(value: LogLevelLike): LogLevel {
  switch (value) {
    case "silent":
    case "quiet":
      return LogLevel.Silent;

    case "error":
    case "err":
      return LogLevel.Error;

    case "warning":
    case "warn":
      return LogLevel.Warning;

    case "info":
    case "normal":
    case "default":
      return LogLevel.Info;

    case "verbose":
      return LogLevel.Verbose;

    case "debug":
    case "trace":
      return LogLevel.Debug;

    default:
      return LogLevel.Info;
  }
}

export interface Log {
  text: string;
  level: LogLevel;
}

export class Logger extends WritableStream<Log> {
  #controllers = new Set<ReadableStreamController<Log>>();

  readonly writer = this.getWriter();

  constructor() {
    super({
      write: (chunk) => {
        for (const controller of this.#controllers) {
          controller.enqueue(chunk);
        }
      },
      close: () => {
        for (const controller of this.#controllers) {
          controller.close();
        }
      },
    });
  }

  createReadableStream(
    strategy?: QueuingStrategy<Log> | undefined,
  ): ReadableStream<Log> {
    let controller: ReadableStreamController<Log> | undefined;

    return new ReadableStream(
      {
        start: (param) => {
          this.#controllers.add((controller = param));
        },
        cancel: () => {
          this.#controllers.delete(controller!);
        },
      },
      strategy,
    );
  }

  async #write(text: string, level: LogLevel) {
    await this.writer.write({ text, level });
  }

  async #writeDebug(data: unknown[], level: LogLevel) {
    await this.#write(
      data
        .map((object) =>
          typeof object === "string" ? object : inspect(object),
        )
        .join(" "),
      level,
    );
  }

  debug(...data: unknown[]) {
    this.#writeDebug(data, LogLevel.Debug);
  }

  verbose(...data: unknown[]) {
    this.#writeDebug(data, LogLevel.Verbose);
  }

  info(text: string) {
    this.#write(text, LogLevel.Info);
  }

  warn(text: string) {
    this.#write(text, LogLevel.Warning);
  }

  error(text: string) {
    this.#write(text, LogLevel.Error);
  }

  fatal(text: string): never {
    this.error(text);
    process.exit(1);
  }

  override async close() {
    await this.writer.close();
    await super.close();
  }
}

export class StreamTransform<R, W = R> implements ReadableWritablePair<R, W> {
  readable: ReadableStream<R>;
  writable: WritableStream<W>;

  constructor(public transform: (log: W) => R) {
    let controller: ReadableStreamController<R> | undefined;
    this.readable = new ReadableStream({
      start: (param) => {
        controller = param;
      },
    });
    this.writable = new WritableStream({
      write: (log) => {
        controller!.enqueue(transform(log));
      },
    });
  }
}

export interface LogFormatterOptions {
  colorize?: boolean | undefined;
}

export class LogFormatter extends StreamTransform<Log> {
  constructor(options?: LogFormatterOptions) {
    super((log) => {
      const chalk = new Chalk({
        level: options?.colorize && supportsColor ? supportsColor.level : 0,
      });

      let text = log.text;

      switch (log.level) {
        case LogLevel.Debug:
          text = chalk.dim("[DBUG] " + text);
          break;

        case LogLevel.Verbose:
          text = chalk.dim("[VERB] " + text);
          break;

        case LogLevel.Info:
          text = chalk.blue("[INFO] ") + text;
          break;

        case LogLevel.Warning:
          text = chalk.yellow("[WARN] ") + text;
          break;

        case LogLevel.Error:
          text = chalk.red("[ERR!] ") + text;
          break;
      }

      return {
        ...log,
        text,
      };
    });
  }
}

export class LogUncolorize extends StreamTransform<Log> {
  constructor() {
    super((log) => {
      const text = stripAnsi(log.text);
      return {
        ...log,
        text,
      };
    });
  }
}

export class LogToJSON extends StreamTransform<Log> {
  constructor() {
    super((log) => {
      const text = JSON.stringify(log);
      return {
        ...log,
        text,
      };
    });
  }
}

export class LogFileWriter extends WritableStream<Log> {
  constructor(path: PathLike, level: LogLevel) {
    let fd: number | undefined;
    super({
      start: () => {
        fd = openSync(path, "w");
      },
      write: (log) => {
        if (log.level > level) {
          return;
        }

        appendFileSync(fd!, log.text + "\n");
      },
      close: () => {
        closeSync(fd!);
      },
    });
  }
}

export class LogConsoleWriter extends WritableStream<Log> {
  constructor(level: LogLevel) {
    super({
      write: (log) => {
        if (log.level > level) {
          return;
        }

        const stream =
          log.level <= LogLevel.Warning ? process.stderr : process.stdout;
        stream.write(log.text + "\n");
      },
    });
  }
}

export default new Logger();
