import { defineConfig, devices } from "@playwright/test"
import path from "node:path"

const isCi = process.env.CI === "true"
const repositoryRoot = path.resolve(import.meta.dirname, "../../..")

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCi,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:43102",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm --filter ardo-docs dev --host 127.0.0.1 --port 43102 --strictPort",
    cwd: repositoryRoot,
    url: "http://127.0.0.1:43102/v6/de/guide/internationalization/",
    reuseExistingServer: !isCi,
    timeout: 120_000,
  },
})
