import { defineConfig, devices } from "@playwright/test"
import { existsSync } from "node:fs"

const isCi = process.env.CI === "true"
const usePrebuiltDocs = process.env.ARDO_E2E_PREBUILT_DOCS === "true"

if (usePrebuiltDocs) {
  const missingRoutes: string[] = []

  if (!existsSync("docs/build/client/v5/guide/getting-started/index.html")) {
    missingRoutes.push("v5/guide/getting-started/index.html")
  }

  if (!existsSync("docs/build/client/v5/guide/markdown/index.html")) {
    missingRoutes.push("v5/guide/markdown/index.html")
  }

  if (missingRoutes.length > 0) {
    throw new Error(
      `Prebuilt docs are missing required routes in docs/build/client: ${missingRoutes.join(", ")}. Run pnpm docs:build first.`
    )
  }
}

const docsServerCommand = usePrebuiltDocs
  ? "pnpm exec http-server docs/build/client -a 127.0.0.1 -p 4173 -s"
  : "pnpm docs:build && pnpm exec http-server docs/build/client -a 127.0.0.1 -p 4173 -s"

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 1 : undefined,
  reporter: isCi ? [["github"], ["list"]] : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  webServer: {
    command: docsServerCommand,
    reuseExistingServer: !isCi,
    timeout: 120_000,
    url: "http://127.0.0.1:4173",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
