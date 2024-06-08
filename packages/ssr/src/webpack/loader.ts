import {
  createNodeModuleProvider,
  render,
  type Diagnostic,
  type RenderOptions,
} from "../node/index.js";
import { formatFileLocation } from "@knuckles/location";
import { urlToRequest } from "loader-utils";
import { validate } from "schema-utils";
import type { Schema } from "schema-utils/declarations/validate.js";
import type { LoaderDefinitionFunction } from "webpack";

const schema: Schema = {
  type: "object",
  properties: {
    plugins: {
      type: "array",
    },
    useBuiltins: {
      type: "boolean",
    },
    attributes: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
};

const loader: LoaderDefinitionFunction = function (source) {
  const callback = this.async();
  const options = this.getOptions();

  try {
    validate(schema, options, {
      name: "Example Loader",
      baseDataPath: "options",
    });
  } catch (error) {
    callback(error instanceof Error ? error : new Error(String(error)));
    return;
  }

  const fileName = urlToRequest(this.resourcePath);

  const moduleProvider = createNodeModuleProvider(fileName, {
    resolve: (ctx) => {
      return new Promise((resolve, reject) => {
        this.resolve(this.context, ctx.specifier, (err, result) => {
          if (err) {
            reject(err);
          } else if (!result) {
            reject(new Error(`Webpack could not resolve '${ctx.specifier}'.`));
          } else {
            resolve({ id: result });
          }
        });
      });
    },
  });

  const formatDiagnostic = (diagnostic: Diagnostic) => {
    return (
      (diagnostic.range?.start
        ? formatFileLocation(diagnostic.filename, diagnostic.range?.start) +
          ": "
        : "") + diagnostic.message
    );
  };

  const renderOptions: RenderOptions = {
    ...options,
    fileName,
    module: moduleProvider,
  };

  render(source, renderOptions)
    .then((result) => {
      for (const error of result.errors) {
        this.emitError(new Error(formatDiagnostic(error)));
      }

      for (const warning of result.warnings) {
        this.emitWarning(new Error(formatDiagnostic(warning)));
      }

      callback(undefined, result.modified ?? undefined);
    })
    .catch(callback);
};

export default loader;
