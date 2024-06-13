import command from "../../command.js";
import logger from "../../logger.js";
import { formatIssue } from "./format.js";
import { resolveFiles } from "./resolve-files.js";
import {
  Analyzer,
  type AnalyzerSeverity,
  type AnalyzerFlags,
} from "@knuckles/analyzer";
import {
  findConfigFile,
  readConfigFile,
  defaultConfig,
} from "@knuckles/config";
import { readFile, writeFile } from "node:fs/promises";
import ts from "typescript";

export default command({
  command: "analyze [entries...]",
  builder: (yargs) =>
    yargs
      .positional("entries", {
        type: "string",
        array: true,
      })
      .options({
        config: {
          alias: "c",
        },
        typeCheck: {
          alias: "ts",
          type: "boolean",
          default: false,
        },
        emitMeta: {
          type: "boolean",
          default: false,
        },
        tsconfig: {
          type: "string",
        },
      }),
  handler: async (args) => {
    let configResolution: "force" | "auto" | "disabled";
    let configFileName: string | undefined;

    switch (args.config) {
      case undefined:
        configResolution = "auto";
        break;

      case true:
      case "true":
        configResolution = "force";
        break;

      case false:
      case "false":
        configResolution = "disabled";
        break;

      default:
        configResolution = "force";
        configFileName = String(args.config);
        break;
    }

    let config = defaultConfig;

    if (configResolution !== "disabled") {
      const configFilePath = await findConfigFile(".", configFileName);

      if (configFilePath) {
        config = await readConfigFile(configFilePath);
      } else if (configResolution === "force") {
        logger.error("Could not find config file.");
        process.exit(1);
      }
    }

    if (args.typeCheck) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      let exports: typeof import("@knuckles/typescript/analyzer");
      try {
        exports = await import("@knuckles/typescript/analyzer");
      } catch (error) {
        logger.debug(error);
        logger.error(
          'You need to install "@knuckles/typescript" to run type checking.',
        );
        process.exit(1);
      }
      const { default: tsPlugin } = exports;
      config.analyzer.plugins.unshift(await tsPlugin());
    }

    logger.debug("Config:", config);

    const flags: AnalyzerFlags = {
      tsconfig: args.tsconfig,
    };

    if (!flags.tsconfig) {
      flags.tsconfig = ts.findConfigFile(process.cwd(), ts.sys.fileExists);
    }

    logger.debug("Flags:", flags);

    const analyzer = new Analyzer({
      config,
      flags,
    });
    await analyzer.initialize();

    // Resolve files
    logger.debug("Enties:", args.entries);
    if (!args.entries?.length) {
      logger.error("No inputs passed.");
      process.exit(1);
    }
    const files = await resolveFiles(args.entries, {
      include: config.analyzer.include,
      exclude: config.analyzer.exclude,
    });
    logger.debug("Files:", files);

    if (files.length === 0) {
      logger.error("No matching files found.");
    }

    for (const fileName of files) {
      // Analyze file
      logger.debug("File: " + fileName);
      const content = await readFile(fileName, "utf-8");
      const result = await analyzer.analyze(fileName, content);
      logger.debug("Issues:", result.issues);

      // Report issues
      for (const issue of result.issues) {
        const setting = config.analyzer.rules[issue.name] ?? "on";
        if (setting === "off") continue;

        // Update issue severity
        issue.severity =
          setting === "on" ? issue.severity : (setting as AnalyzerSeverity);

        // Format issue
        const formatted = formatIssue(issue, {
          color: "auto",
          fileName,
        });

        // Log issue
        process.stderr.write(formatted + "\n");
      }

      if (args.emitMeta) {
        const meta = {
          snapshots: Object.entries(result.snapshots)
            .filter(([_name, snapshot]) => !!snapshot)
            .map(([name, snapshot]) => ({
              name,
              original: snapshot!.original,
              generated: snapshot!.generated,
              mappings: snapshot!.mappings,
            })),
        };

        await writeFile(fileName + "-meta.json", JSON.stringify(meta));
      }
    }
  },
});
