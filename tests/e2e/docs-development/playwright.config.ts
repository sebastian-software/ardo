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
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm --filter ardo-docs dev --host 127.0.0.1 --port 0 --strictPort",
    cwd: repositoryRoot,
    // Port 0 lets the OS reserve a free port without a probe-then-bind race.
    // Playwright passes the captured URL to the browser worker's environment.
    wait: { stdout: /Local:\s+(?<ardo_docs_dev_url>http:\/\/127\.0\.0\.1:\d+)\//u },
    timeout: 120_000,
  },
})
