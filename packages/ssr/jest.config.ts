/* eslint-disable */
export default {
  displayName: "@knuckles/ssr",
  preset: "../../jest.preset.cjs",
  coverageDirectory: "../../coverage/packages/ssr",
  modulePathIgnorePatterns: ["<rootDir>/e2e/"],
  globalSetup: "./test/setup.ts",
};
