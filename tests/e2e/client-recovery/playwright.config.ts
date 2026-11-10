import { defineConfig, devices } from "@playwright/test"
import path from "node:path"

const root = path.resolve(import.meta.dirname, "../../..")
const sites = [
  { name: "custom", port: 4188, argument: "" },
  { name: "default", port: 4189, argument: "default-root" },
]
export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  reporter: "list",
  use: { trace: "retain-on-failure" },
  projects: sites.map(({ name, port }) => ({
    name,
    testMatch: "recovery.spec.ts",
    use: { ...devices["Desktop Chrome"], baseURL: `http://127.0.0.1:${port}` },
  })),
  webServer: sites.map(({ port, argument }) => ({
    command: `node tests/e2e/examples/serve-fixture.ts client-recovery preview ${port} replace-routes ${argument}`,
    cwd: root,
    url: `http://127.0.0.1:${port}/recover/en/`,
    timeout: 180_000,
  })),
})
