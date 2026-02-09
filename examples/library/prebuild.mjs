import { generateApiDocs } from "ardo/typedoc"

await generateApiDocs(
  {
    enabled: true,
    entryPoints: ["./src/index.ts"],
    tsconfig: "./tsconfig.api.json",
    out: "api-reference",
  },
  "./app/routes"
)
