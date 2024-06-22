import {
  LogLevel,
  createVersioningPlan,
  getCommitHistory,
  getWorkspace,
  logger,
  readJsoncFile,
} from "conventional-versioning";
import { $ } from "execa";
import assert from "node:assert/strict";
import { Octokit } from "octokit";

logger.pipe((log) => {
  if (log.level <= LogLevel.Warning) {
    console.error(log.text);
  }
});

const {
  GITHUB_TOKEN,
  GITHUB_REPO,
  GITHUB_HEAD_BRANCH = "automated-versioning",
  GITHUB_BASE_BRANCH = "main",
  CONVER_CONFIG = "conver.json",
} = process.env;
assert(GITHUB_TOKEN, "Missing 'GITHUB_TOKEN' environment variable.");
assert(GITHUB_REPO, "Missing 'GITHUB_REPO' environment variable.");

const [owner, repo] = GITHUB_REPO.split("/");

// Make sure working directory is clean.
if (!(await isClean())) {
  console.error("Working directory is not clean. Exiting.");
  process.exit(1);
}

// Make sure current branch is base branch.
if ((await getCurrentBranch()) !== GITHUB_BASE_BRANCH) {
  console.error("Switch to base branch before running. Exiting.");
  process.exit(1);
}

// Switch to head branch.
console.info(`Switching branch to ${GITHUB_HEAD_BRANCH}.`);
await $`git checkout -B ${GITHUB_HEAD_BRANCH}`;

// Get versioning plan.
/** @type {import('conventional-versioning').Options} */
const options = await readJsoncFile(CONVER_CONFIG);
const workspace = await getWorkspace(options);
const history = await getCommitHistory(options);
const updates = createVersioningPlan(workspace, history, options);

// Do versioning.
await $`pnpm conver version --yes`;

if (await isClean()) {
  console.log("No changes. Exiting.");
  process.exit();
}

// Push changes.
console.info(`Pushing changes to ${GITHUB_HEAD_BRANCH}.`);
await $`git commit -a -m ${"chore: version package(s)"}`;
await $`git push --force -u origin ${GITHUB_HEAD_BRANCH}`;

let pullBody =
  "This pull request was opened by the " +
  "[release action](https://github.com/tscpp/knuckles/actions/workflows/release.yml) " +
  "since new versions are available and will automatically stay in sync.\n\n" +
  updates
    .map(
      (update) =>
        `- ${update.name}: ${update.oldVersion} -> ${update.newVersion}`,
    )
    .join("\n") +
  "\n";

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

console.info("Searching for existing pull request.");
const response = await octokit.rest.pulls.list({
  owner,
  repo,
  state: "open",
  head: owner + ":" + GITHUB_HEAD_BRANCH,
  base: GITHUB_BASE_BRANCH,
  per_page: 1,
});
assert.equal(response.status, 200, "Expected response status code 200.");
const [pull] = response.data;

if (pull) {
  console.info(`Found existing pull request #${pull.number}.`);
  assert.equal(pull.head.ref, GITHUB_HEAD_BRANCH);
  assert.equal(pull.base.ref, GITHUB_BASE_BRANCH);
  console.info("Updating existing pull request.");
  const response = await octokit.rest.pulls.update({
    owner,
    repo,
    pull_number: pull.number,
    body: pullBody,
  });
  assert.equal(response.status, 200, "Expected response status code 200.");
} else {
  console.info("Did not find existing pull request.");
  console.info("Creating a new pull request.");
  const response = await octokit.rest.pulls.create({
    owner,
    repo,
    head: GITHUB_HEAD_BRANCH,
    base: GITHUB_BASE_BRANCH,
    title: "chore: version package(s)",
    body: pullBody,
  });
  assert.equal(response.status, 201, "Expected response status code 201.");
  console.info(`Created pull request #${response.data.number}.`);
}

console.info(`Switching branch to ${GITHUB_BASE_BRANCH}.`);
await $`git checkout ${GITHUB_BASE_BRANCH}`;

async function isClean() {
  const { stdout } = await $`git status --porcelain`;
  return stdout.trim() === "";
}

async function getCurrentBranch() {
  const { stdout } = await $`git branch --show-current`;
  return stdout.trim();
}
