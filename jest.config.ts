import { getJestProjectsAsync } from "@nx/jest";

export default async () => ({
  projects: await getJestProjectsAsync(),
  verbose: true,
  coverageReporters: ["lcov"],
});
