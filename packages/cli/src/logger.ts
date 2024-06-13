import { supportsColor } from "chalk";
import winston from "winston";

export const levels = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 4,
  debug: 5,
};

export default winston.createLogger({
  levels,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        ...(supportsColor ? [winston.format.colorize()] : []),
        winston.format.simple(),
      ),
    }),
  ],
});

export const createDebugFile = () =>
  new winston.transports.File({
    filename: "ko.debug.log",
    level: "debug",
    options: {
      flags: "w",
    },
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.simple(),
    ),
  });
