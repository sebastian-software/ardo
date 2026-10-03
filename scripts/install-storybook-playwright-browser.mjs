import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"

const requireFromRepository = createRequire(new URL("../package.json", import.meta.url))
const storybookRequire = createRequire(requireFromRepository.resolve("@storybook/test-runner"))
const playwrightPackagePath = storybookRequire.resolve("playwright/package.json")
const playwrightPackage = JSON.parse(readFileSync(playwrightPackagePath, "utf8"))
const cliEntry = playwrightPackage.bin?.playwright

if (typeof cliEntry !== "string") {
  throw new Error("The Storybook Playwright package does not expose a CLI binary")
}

const playwrightCli = resolve(dirname(playwrightPackagePath), cliEntry)
console.log(
  `Installing Chromium for Storybook Playwright ${playwrightPackage.version} from ${playwrightCli}`
)

const install = spawnSync(process.execPath, [playwrightCli, "install", "--with-deps", "chromium"], {
  stdio: "inherit",
})

if (install.error) {
  throw install.error
}

if (install.status !== 0) {
  process.exit(install.status ?? 1)
}
