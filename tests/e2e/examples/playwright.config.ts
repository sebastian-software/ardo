import { defineConfig, devices } from "@playwright/test"
import path from "node:path"

const repositoryRoot = path.resolve(import.meta.dirname, "../../..")
const usePreview = process.env.ARDO_EXAMPLE_BROWSER_SERVER === "preview"
const isCi = process.env.CI === "true"
const sites = [
  {
    name: "basic",
    directory: "examples/basic",
    port: usePreview ? 4175 : 4174,
    testMatch: "basic.spec.ts",
  },
  {
    name: "runtime",
    directory: "tests/fixtures/runtime",
    port: usePreview ? 4177 : 4176,
    testMatch: "runtime-counter.spec.ts",
  },
]

export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  reporter: "list",
  use: { trace: "on-first-retry" },
  projects: sites.map((site) => ({
    name: `${site.name}-${usePreview ? "preview" : "dev"}`,
    testMatch: site.testMatch,
    use: { ...devices["Desktop Chrome"], baseURL: `http://127.0.0.1:${site.port}` },
  })),
  webServer: sites.map((site) => ({
    command: `${usePreview ? "pnpm --config.verifyDepsBeforeRun=false exec ardo build && " : ""}pnpm --config.verifyDepsBeforeRun=false exec ardo ${usePreview ? "preview" : "dev"} --host 127.0.0.1 --port ${site.port} --strictPort`,
    cwd: path.join(repositoryRoot, site.directory),
    url: `http://127.0.0.1:${site.port}`,
    reuseExistingServer: !isCi,
    timeout: 180_000,
  })),
})
