import { generateApiDocs } from "ardo/typedoc"

// Generate API docs for the alpha package
await generateApiDocs(
  {
    enabled: true,
    entryPoints: ["./packages/alpha/src/index.ts"],
    tsconfig: "./packages/alpha/tsconfig.json",
    out: "api-reference/alpha",
  },
  "./app/routes"
)

// Generate API docs for the beta package
await generateApiDocs(
  {
    enabled: true,
    entryPoints: ["./packages/beta/src/index.ts"],
    tsconfig: "./packages/beta/tsconfig.json",
    out: "api-reference/beta",
  },
  "./app/routes"
)
