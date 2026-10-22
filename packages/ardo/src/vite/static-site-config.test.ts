import type { UserConfig } from "vite"

import { describe, expect, it } from "vitest"

import { ardoPlugin } from "./plugin"

type CleanupCase = { name: string; input: UserConfig; client: boolean; ssr: boolean }
const cases: CleanupCase[] = [
  { name: "default clean builds", input: {}, client: true, ssr: true },
  {
    name: "root preservation",
    input: { build: { emptyOutDir: false } },
    client: false,
    ssr: false,
  },
  {
    name: "client preservation overrides root cleanup",
    input: {
      build: { emptyOutDir: true },
      environments: { client: { build: { emptyOutDir: false } } },
    },
    client: false,
    ssr: true,
  },
  {
    name: "SSR cleanup overrides root preservation",
    input: {
      build: { emptyOutDir: false },
      environments: { ssr: { build: { emptyOutDir: true } } },
    },
    client: false,
    ssr: true,
  },
]

function staticConfig(input: UserConfig): UserConfig {
  const plugin = ardoPlugin({ githubPages: false, icons: false }).find(
    (entry) => entry.name === "ardo:static-site"
  )
  const hook = plugin?.config
  if (typeof hook !== "function") throw new Error("Static site plugin not found")
  return Reflect.apply(hook, {}, [
    { root: "/project", ...input },
    { command: "build", mode: "production" },
  ]) as UserConfig
}

describe("static build output configuration", () => {
  it.each(cases)("honors $name", ({ input, client, ssr }) => {
    const result = staticConfig(input)
    expect(result.environments?.client?.build?.emptyOutDir).toBe(client)
    expect(result.environments?.ssr?.build?.emptyOutDir).toBe(ssr)
    expect(result.environments?.client?.build?.outDir).toBe("/project/build/client")
    expect(result.environments?.ssr?.build?.outDir).toBe("/project/build/server")
  })
})
