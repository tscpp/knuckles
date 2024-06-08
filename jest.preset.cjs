module.exports = {
  extensionsToTreatAsEsm: [".ts"],
  verbose: true,
  resolver: "@nx/jest/plugins/resolver",
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "<rootDir>/tsconfig.spec.json",
      },
    ],
  },
};
