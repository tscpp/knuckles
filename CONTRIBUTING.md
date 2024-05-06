# Contributing

[![Open in Dev Container](https://img.shields.io/static/v1?style=for-the-badge&label=Dev+Container&message=Open&color=blue&logo=visualstudiocode)](https://vscode.dev/redirect?url=vscode://ms-vscode-remote.remote-containers/cloneInVolume?url=https://github.com/tscpp/knuckles)

## Getting Started

This repository has a configured [Dev Container](https://containers.dev/) for development. You can setup various editors with Dev Containers without any manual installation or configuration. For detailed instructions, see:

- [Visual Studio Code](https://code.visualstudio.com/docs/devcontainers/tutorial) (recommended)
- [GitHub Codespaces](https://docs.github.com/en/codespaces/getting-started/quickstart) (web)

## Development

### Tasks

Tasks are managed by the [Nx](#build-system) build system, which automatically handles dependencies between packages, ensuring that prerequisites are run as needed. Only execute the task you actually intend to complete.

Tasks are defined in the `project.json` file for each package and inherit from the workspace's nx.json file. The project name should begin with `@knuckles/` followed by the directory name, as specified in the `project.json` file.

```sh
nx <task> <project>

# Example:
nx build @knuckles/analyzer
```

#### Defined Tasks

<dl>
  <dt><code>nx build</code></dt>
  <dd>Generates the package distributable, essential before releasing.</dd>

  <dt><code>nx lint</code></dt>
  <dd>Identifies common issues in the project by running eslint.</dd>

  <dt><code>nx test</code></dt>
  <dd>Executes unit tests for the project.</dd>

  <dt><code>nx e2e</code></dt>
  <dd>Runs end-to-end tests, usually requiring a testing environment like a browser.</dd>

  <dt><code>pnpm run format</code></dt>
  <dd>Formats the project's code using prettier. Can only be run from workspace root.</dd>

  <dt><code>nx type-check</code></dt>
  <dd>Checks the project for typing issues using TypeScript.</dd>
</dl>

### Third-Party Packages

Third-Party packages (dependencies) are managed by the [pnpm](#package-manager) package manager.

#### Installing Packages

```sh
# Ex: make sure everything is installed.
pnpm install

# Ex: installing a dependency to a project.
pnpm add --filter <project> <package>

# Ex: installing a dev dependency to a project.
pnpm add --filter <project> --save-dev <package>

# Ex: installing a dev dependency to workspace package.
pnpm add -w --save-dev <package>
```

### Samples

Samples are small project used to manually test the workspace packages. Visit each sample's readme for details.

### Workspace Structure

- `packages/` - Source code for all public `@knuckles` packages.
- `tools/` - Development (private) packages such as `@dev/nx` and `@dev/tsconfig`

## Toolkit

### Package Manager

[PNPM](https://pnpm.io/) is a tool for managing third-party packages (dependencies). It functions similarly to npm but offers extra features and works particularly well with monorepos.

### Javascript Runtime

Our packages are designed to work with [NodeJS](https://nodejs.org/). During development, [Bun](https://bun.sh/) is used, which is a fast JavaScript runtime that's (almost) fully NodeJS backwards compatible. Bun provides a great development toolkit and nativly supports TypeScript.

### Build System

[Nx](https://nx.dev/) is a build system with built-in tooling for monorepos. It runs tasks effectivly and caches.

```sh
# Build single project
nx build @knuckles/compiler

# Build all projects
nx run-many -t build
```
