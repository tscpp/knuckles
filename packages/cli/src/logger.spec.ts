import { LogFormatter, LogLevel, LogUncolorize, Logger } from "./logger.js";
import { it, describe, expect } from "@jest/globals";
import chalk from "chalk";
import assert from "node:assert/strict";

describe("logger", () => {
  it("writes to stream", async () => {
    const logger = new Logger();
    const stream = logger.createReadableStream();
    const reader = stream.getReader();
    logger.info("Hello world!");
    const result = await reader.read();
    assert(!result.done);
    expect(result.value.level).toBe(LogLevel.Info);
    expect(result.value.text).toBe("Hello world!");
  });

  it("strips colors from logs", async () => {
    const logger = new Logger();
    const stream = logger
      .createReadableStream()
      .pipeThrough(new LogUncolorize());
    const reader = stream.getReader();
    logger.info(`Hello ${chalk.green("world")}!`);
    const result = await reader.read();
    assert(!result.done);
    expect(result.value.level).toBe(LogLevel.Info);
    expect(result.value.text).toBe("Hello world!");
  });

  it("formats logs", async () => {
    const logger = new Logger();
    const stream = logger
      .createReadableStream()
      .pipeThrough(new LogFormatter({ colorize: false }));
    const reader = stream.getReader();
    logger.info(`Hello world!`);
    const result = await reader.read();
    assert(!result.done);
    expect(result.value.level).toBe(LogLevel.Info);
    expect(result.value.text).toBe("[INFO] Hello world!");
  });
});
