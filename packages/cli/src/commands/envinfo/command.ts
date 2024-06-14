import command from "../../command.js";
import * as envinfo from "envinfo";

export default command({
  command: "envinfo",
  builder: (yargs) => yargs,
  handler: async () => {
    await envinfo.run(
      {
        Binaries: ["Node"],
        npmPackages: [
          "@knuckles/analyzer",
          "@knuckles/cli",
          "@knuckles/eslint",
          "@knuckles/typescript",
        ],
      },
      {
        console: true,
      },
    );
  },
});
