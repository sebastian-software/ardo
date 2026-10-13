import { defineConfig, devices } from "@playwright/test"
import { fileURLToPath } from "node:url"

const usePreview = process.env.ARDO_BASIC_BROWSER_SERVER === "preview"
const port = usePreview ? 4175 : 4174
const serverCommand = usePreview
  ? "pnpm --config.verifyDepsBeforeRun=false exec ardo build && pnpm --config.verifyDepsBeforeRun=false exec ardo preview --host 127.0.0.1 --port 4175 --strictPort"
  : "pnpm --config.verifyDepsBeforeRun=false exec ardo dev --host 127.0.0.1 --port 4174 --strictPort"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: serverCommand,
    cwd: fileURLToPath(new URL(".", import.meta.url)),
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
