# Ardo reference projects

These projects are the executable setup contracts used by Ardo's
[Agent Instructions](../docs/app/routes/guide/agent-instructions.mdx).

For a released package, read the examples from its exact `ardo-v<version>` Git
tag. Do not copy examples from `main` into a project using a different release.
For development, use the instructions, examples, and built Ardo package from
the same checkout revision. When adapting an example into an independent
project, replace its `ardo: workspace:*` dependency with the selected released
version and retain compatible dependency versions from that tag.

| Reference                          | Intended use                                       | Checked output                                          |
| ---------------------------------- | -------------------------------------------------- | ------------------------------------------------------- |
| [basic](basic)                     | New site or product documentation in one React app | Prerendered guide pages and client assets               |
| [library](library)                 | Guides and native TypeScript API documentation     | API pages, inherited descriptions, and type expressions |
| [monorepo](monorepo)               | Documentation for multiple workspace packages      | Workspace API pages                                     |
| [content-sources](content-sources) | Markdown owned outside the route tree              | Generated routes and a React collection catalog         |

Read each project's README for its configuration seams and generated-file
boundaries. Preserve existing application behavior when adapting a reference.
Tailwind and deployment workflows are project choices. For an independent pnpm
project, allow esbuild's build script as shown in the manual installation guide;
do not copy Ardo's entire workspace policy.

From the repository root, run:

```bash
pnpm install
pnpm build
pnpm test:integration
```

The integration suite builds the references and checks their generated output.
`packed-reference.test.ts` also copies the basic and library references into
temporary directories, installs the packed Ardo package, typechecks each
consumer, and builds its static pages. CI runs these checks on Node.js 22, 24,
and 26. No starter CLI is involved.
