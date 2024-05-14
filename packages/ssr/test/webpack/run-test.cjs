// @ts-nocheck
const memfs = require("memfs");
const assert = require("assert");
const webpack = require("webpack");
const path = require("path");

const compiler = webpack({
  mode: "production",
  entry: path.resolve(__dirname, "../__fixtures__/entry.js"),
  output: {
    path: "/",
    filename: "output.js",
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: ["raw-loader", path.resolve(__dirname, "./build/loader.cjs")],
      },
    ],
  },
});

const fs = memfs.createFsFromVolume(new memfs.Volume());
compiler.outputFileSystem = fs;

compiler.run((err, stats) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  const close = (err) => {
    compiler.close((closeErr) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }

      if (closeErr) {
        console.error(closeErr);
        process.exit(1);
      }

      process.exit(0);
    });
  };

  if (stats.hasErrors() || stats.hasWarnings()) {
    console.error(stats.toString());
    return close(
      new Error(
        `webpack compilation has ${stats.hasErrors() ? "errors" : "warnings"}`,
      ),
    );
  }

  const output = fs.readFileSync("/output.js", "utf8");
  assert(output.includes("SSR"), "generated chunk is missing rendered text");

  return close();
});
