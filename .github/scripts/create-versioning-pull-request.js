import {
  Config,
  createGit,
  createVersioningPlan,
  getCommits,
  getWorkspace,
} from "conventional-versioning";
import { $ } from "execa";
import assert from "node:assert/strict";
import { Octokit } from "octokit";
import yn from "yn";

const {
  GITHUB_TOKEN,
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_HEAD_BRANCH = "automated-versioning",
  GITHUB_BASE_BRANCH = "main",
  CONVER_CONFIG = "conver.json",
  CONVER_WORKSPACE_ROOT = "./",
  CONVER_DRY,
} = process.env;
assert(GITHUB_TOKEN, "Missing 'GITHUB_TOKEN' environment variable.");
assert(GITHUB_OWNER, "Missing 'GITHUB_OWNER' environment variable.");
assert(GITHUB_REPO, "Missing 'GITHUB_REPO' environment variable.");

const dry = yn(CONVER_DRY);

if (!dry && !(await isClean())) {
  console.error("Working directory is not clean. Exiting.");
  process.exit(1);
}

if (!dry && (await getCurrentBranch()) !== GITHUB_BASE_BRANCH) {
  console.error("Switch to base branch before running. Exiting.");
  process.exit(1);
}

if (!dry) {
  console.info(`Switch branch to ${GITHUB_BASE_BRANCH}.`);
  await $`git checkout -f ${GITHUB_BASE_BRANCH}`;
}

const config = await Config.read(CONVER_CONFIG);
const base = config.getBase();

console.info("Running conventional versioning.");
await $`pnpm conventional-versioning version --dry-run=${!!dry}`;

if (!dry && (await isClean())) {
  console.error("No changes made to working directory. Exiting.");
  process.exit();
}

console.info("Getting versioning plan.");
config.setBase(base); // Do not save!
const workspace = await getWorkspace({
  directory: CONVER_WORKSPACE_ROOT,
  config,
});
const git = await createGit();
const commits = await getCommits({ git, config });
const versioning = await createVersioningPlan({ workspace, config, commits });

if (versioning.length === 0) {
  console.info("No changes were made in versioning.");
  process.exit();
}

if (!dry) {
  console.info(`Pushing changes to ${GITHUB_BASE_BRANCH}.`);
  await $`git add -A`;
  await $`git commit -m "chore: version package(s)"`;
  await $`git push --force origin ${GITHUB_HEAD_BRANCH}`;
}

let pullBody =
  "This pull request was opened by the " +
  "[release action](https://github.com/tscpp/knuckles/actions/workflows/release.yml) " +
  "since new version bumps are available and will automatically stay in sync.\n\n" +
  versioning
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
  owner: GITHUB_OWNER,
  repo: GITHUB_REPO,
  state: "open",
  head: GITHUB_OWNER + ":" + GITHUB_HEAD_BRANCH,
  base: GITHUB_BASE_BRANCH,
  per_page: 1,
});
assert.equal(response.status, 200, "Expected response status code 200.");
const [pull] = response.data;

if (pull) {
  console.info(
    `Found existing pull request #${pull.number}. Updating existing pull request.`,
  );
  assert.equal(pull.head.ref, GITHUB_HEAD_BRANCH);
  assert.equal(pull.base.ref, GITHUB_BASE_BRANCH);
  if (!dry) {
    const response = await octokit.rest.pulls.update({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      pull_number: pull.number,
      body: pullBody,
    });
    assert.equal(response.status, 200, "Expected response status code 200.");
    console.info("Successfully updated pull request.");
  }
} else {
  console.info(
    "Did not find existing pull request. Creating a new pull request.",
  );
  if (!dry) {
    const response = await octokit.rest.pulls.create({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      head: GITHUB_HEAD_BRANCH,
      base: GITHUB_BASE_BRANCH,
      title: "chore: version package(s)",
      body: pullBody,
    });
    assert.equal(response.status, 201, "Expected response status code 201.");
    console.info(`Created pull request #${response.data.number}.`);
  }
}

async function isClean() {
  const { stdout } = await $`git status --porcelain`;
  return stdout.trim() === "";
}

async function getCurrentBranch() {
  const { stdout } = await $`git branch --show-current`;
  return stdout.trim();
}
