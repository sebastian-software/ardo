import { defineConfig, devices } from "@playwright/test"
import { existsSync } from "node:fs"

const isCi = process.env.CI === "true"
const usePrebuiltDocs = process.env.ARDO_E2E_PREBUILT_DOCS === "true"
const usePagesArtifact = process.env.ARDO_E2E_PAGES_ARTIFACT === "true"
const docsClientDir = usePagesArtifact ? "docs/build/pages" : "docs/build/client"

if (usePrebuiltDocs) {
  const missingRoutes: string[] = []

  if (!existsSync(`${docsClientDir}/v6/guide/getting-started/index.html`)) {
    missingRoutes.push("v6/guide/getting-started/index.html")
  }

  if (!existsSync(`${docsClientDir}/v6/guide/markdown/index.html`)) {
    missingRoutes.push("v6/guide/markdown/index.html")
  }

  if (!existsSync(`${docsClientDir}/v6/guide/components/index.html`)) {
    missingRoutes.push("v6/guide/components/index.html")
  }

  if (missingRoutes.length > 0) {
    throw new Error(
      `Prebuilt docs are missing required routes in ${docsClientDir}: ${missingRoutes.join(", ")}. Build the docs and prepare the Pages artifact when testing snapshots.`
    )
  }
}

const prepareDocsCommand = usePagesArtifact
  ? "pnpm docs:build && pnpm docs:prepare-pages"
  : "pnpm docs:build"
const serveDocsCommand = `pnpm exec http-server ${docsClientDir} -a 127.0.0.1 -p 4173 -s`
const docsServerCommand = usePrebuiltDocs
  ? serveDocsCommand
  : `${prepareDocsCommand} && ${serveDocsCommand}`

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: "**/examples/**",
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
