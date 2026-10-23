# Ardo example

[Basic](basic) is the single public setup reference: a static documentation site
with Markdown/MDX, search, and a small interactive React component. Add API
reference, collections, or deployment settings as described in
[Agent Instructions](../docs/app/routes/guide/agent-instructions.mdx).

Read the example from the exact `ardo-v<version>` Git tag matching your installed
package. For development, use the example and built package from the same
checkout revision. Follow the Basic README to run it here or copy it into an
independent project.

Maintainer tests live in `tests/integration/examples/` and
`tests/e2e/examples/`. Feature-specific source and configuration live in
`tests/fixtures/`; they are internal regression inputs, not starter projects.
From the repository root, run `pnpm build` and `pnpm test:integration`.
