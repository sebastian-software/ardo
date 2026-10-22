---
name: ardo
description: Set up, adopt, configure, or upgrade Ardo documentation sites in React and TypeScript repositories. Use for Ardo projects and integrations, including generated API reference and MDX components.
---

# Ardo

Use the official agent instructions and tested Basic example to adapt Ardo to
the repository. They own the setup details; this skill does not maintain a
second starter template.

## Choose the release and instructions

- For a new site, use the stable npm `latest` release unless a version was
  requested (for example, check `npm view ardo version`). Do not select a
  prerelease by sorting version numbers or guessing from a website heading.
- For an existing site, inspect its installed Ardo version and configuration.
  Upgrade when requested; preserve the application's routes, styling, and
  scripts when adding documentation.
- Start with <https://ardo-docs.dev/llms.txt> and follow its Agent Instructions
  link. The latest index leads to the current documentation. For a selected older major, use the matching
  `/v<major>/llms.txt` and `/v<major>/guide/agent-instructions/` paths.
  Verify that the instructions match the selected package major. If matching
  documentation or a release tag is unavailable, report the gap rather than
  substituting `main`.
- Read `examples/basic` from the matching `ardo-v<version>` release tag at
  <https://github.com/sebastian-software/ardo>. For unreleased development,
  use the package and example from the same checkout. Do not mix an
  unpublished example with an installed release.

## Adapt the project

Inspect repository instructions, package manager, workspace boundaries, and
existing build configuration before writing files. Follow the agent guide's
new-site, adoption, or upgrade path and load only the relevant feature recipes.

Ardo 6 uses `ardo.config.ts`, `app/root.tsx`, and file routes in `app/routes`.
Ensure `/` has a home route or an intentional redirect. Ardo supplies its React,
React DOM, and Vite runtime; use `ardo/react`, `ardo/react-dom`, and `ardo/vite`
when the instructions require those APIs. Do not add React Router configuration
or the retired `create-ardo` starter to Ardo 6 projects.

Reuse components local to the docs package or installed component packages.
Sibling source imports, source aliases, and workspace links to sibling source
cross Ardo's project boundary. Build and consume a package export instead.
Read the native API recipe before adding its optional compiler dependencies.

## Verify the result

Run the project's typecheck and build, inspect the home page and an authored
guide in the generated output, and resolve broken internal links. Start the dev
server and verify navigation plus an interactive component in a browser when
one is available. For adoption, also run the existing application's relevant
checks. Report the selected release, changed files, checks, and evidence gaps.
Deployment remains a separate action unless requested.
