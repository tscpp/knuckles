import js from "@eslint/js";
import { config, references } from "@tools/eslint";
import prettier from "eslint-config-prettier";
import imprt from "eslint-plugin-import";
import playwright from "eslint-plugin-playwright";
import globals from "globals";
import ts from "typescript-eslint";

export default config([
  {
    ignores: [
      // global
      "**/node_modules/",
      ".nx/cache/",
      "**/*.d.ts",
      "**/samples/",
      "**/dist/",
      "**/build/",
      "**/.vscode-test/",
      "**/vite.config.*",
      "**/jest.config.ts",
      "**/coverage/",
      "**/__fixtures__/",

      // documentation
      "docs/**/*",
      "apps/website/**/*",

      // projects
      "packages/ssr/e2e/frontend/",
      "packages/ssr/scripts/**",
      "packages/internal/",
      "tools/mapping-visualizer/vite.config.ts",
    ],
  },
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    extends: [prettier],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        Bun: "readonly",
      },
    },
  },
  {
    files: ["**/*.js", "**/*.jsx"],
    extends: [js.configs.recommended],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": ts.plugin,
      import: imprt,
    },
    extends: [...ts.configs.recommended],
    languageOptions: {
      parser: ts.parser,
      parserOptions: {
        project: [...references("tsconfig.json")],
      },
    },
    rules: {
      ...imprt.configs.typescript.rules,
      "import/extensions": ["error", "ignorePackages"],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
          disallowTypeAnnotations: true,
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["packages/ssr/e2e/**/*.test.ts"],
    plugins: {
      playwright,
    },
    rules: {
      ...playwright.configs.recommended.rules,
    },
  },
  {
    files: ["tools/nx/src/**/*", "apps/playground/**/*"],
    rules: {
      "import/extensions": "off",
    },
  },
]);
