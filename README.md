# Monorepo

Turborepo template with [pnpm](https://pnpm.io/), [tsdown](https://tsdown.dev/), [vitest](https://vitest.dev/), [biome](https://biomejs.dev/) and [changesets](https://github.com/changesets/changesets).

## Setup

### GitHub App

Create a new GitHub App with the following repository permissions:

- **Contents**: Read and write
- **Pull requests**: Read and write
- **Workflows**: Read and write

Generate a private key of your app, this will download a `.pem` file.

### Repository secrets

In the secrets of your repository, you must've the following:

- **NPM_TOKEN**: your npm token with **Bypass two-factor authentication (2FA)** enabled and **Read and write** permissions for your packages.
- **APP_ID**: your GitHub App id.
- **APP_PRIVATE_KEY**: the contents of the `.pem` file.

### Permissions

In your organization and repo settings go to `Settings -> Actions -> General -> Workflow Permissions` and select: **Allow Github Actions to create and aprove pull requests**.

## Recommended settings

### Rulesets

Create a new **ruleset** (`Repository Settings -> Rules -> Rulesets -> New ruleset`) with the following rules:

- **Restrict deletions**
- **Block force pushes**
- **Require a pull request before merging**
- **Require status checks to pass**
  - Add `validate` with the `Add checks` button.
