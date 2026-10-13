import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { afterEach, describe, expect, it } from "vitest"

import { prepareProjectConfig } from "./project-config"

let temporaryDirectory: string | undefined

afterEach(() => {
  if (temporaryDirectory !== undefined) {
    rmSync(temporaryDirectory, { recursive: true, force: true })
    temporaryDirectory = undefined
  }
})

describe("prepareProjectConfig", () => {
  it("dynamically imports Ardo and statically imports root config files", async () => {
    const root = createProjectRoot()
    const ardoConfigPath = path.join(root, "ardo.config.ts")
    const viteConfigPath = path.join(root, "vite.config.ts")
    writeFileSync(ardoConfigPath, "export default { routes: false }\n")
    writeFileSync(viteConfigPath, "export default { base: '/docs/' }\n")
    writeFileSync(path.join(temporaryDirectory ?? "", "vite.config.ts"), "export default {}\n")

    const wrapperPath = await prepareProjectConfig(root)
    const contents = readFileSync(wrapperPath, "utf8")

    expect(path.basename(wrapperPath)).toMatch(/^vite-[a-f\d]{12}\.config\.mjs$/u)
    expect(path.dirname(wrapperPath)).toBe(path.join(root, "node_modules", ".ardo"))
    expect(contents).toContain(
      `const ardoViteEntry = ${JSON.stringify(import.meta.resolve("ardo/vite"))};`
    )
    expect(contents).toContain(
      "const { createArdoProjectViteConfig } = await import(ardoViteEntry);"
    )
    expect(contents).toContain(
      `import * as ardoConfigModule from ${JSON.stringify(pathToFileURL(ardoConfigPath).href)};`
    )
    expect(contents).toContain(
      `import * as viteConfigModule from ${JSON.stringify(pathToFileURL(viteConfigPath).href)};`
    )
    expect(contents).toContain(
      `createArdoProjectViteConfig(${JSON.stringify(root)}, { ardoConfig, viteConfig, sources: ${JSON.stringify({ ardoConfigPath, viteConfigPath })} })`
    )
    expect(contents).not.toContain(path.join(temporaryDirectory ?? "", "vite.config.ts"))
  })

  it("writes only when the selected config identity changes or content needs repair", async () => {
    const root = createProjectRoot()
    const defaultViteConfig = path.join(root, "vite.config.js")
    const explicitViteConfig = path.join(root, "custom.vite.config.mjs")
    writeFileSync(defaultViteConfig, "export default {}\n")
    writeFileSync(explicitViteConfig, "export default {}\n")

    const defaultWrapper = await prepareProjectConfig(root)
    const oldTimestamp = new Date("2001-01-01T00:00:00.000Z")
    utimesSync(defaultWrapper, oldTimestamp, oldTimestamp)
    const before = statSync(defaultWrapper)
    const sameWrapper = await prepareProjectConfig(root)
    const after = statSync(defaultWrapper)
    const explicitWrapper = await prepareProjectConfig(root, explicitViteConfig)

    expect(sameWrapper).toBe(defaultWrapper)
    expect(after.mtimeMs).toBe(before.mtimeMs)
    expect(explicitWrapper).not.toBe(defaultWrapper)
  })

  it("reports an actionable error for a missing explicitly selected Vite config", async () => {
    const root = createProjectRoot()
    const missingConfig = path.join(root, "missing.vite.config.ts")

    await expect(prepareProjectConfig(root, missingConfig)).rejects.toThrow(
      `[ardo] Vite config file not found: ${missingConfig}`
    )
  })

  it("generates a default wrapper without importing ancestor configs", async () => {
    const root = createProjectRoot()
    const ancestorConfig = path.join(temporaryDirectory ?? "", "vite.config.js")
    writeFileSync(ancestorConfig, "throw new Error('must not load ancestor config')\n")

    const wrapperPath = await prepareProjectConfig(root)
    const contents = readFileSync(wrapperPath, "utf8")

    expect(contents).toContain("const ardoConfig = undefined;")
    expect(contents).toContain("const viteConfig = undefined;")
    expect(contents).toContain(`createArdoProjectViteConfig(${JSON.stringify(root)}`)
    expect(contents).not.toContain(pathToFileURL(ancestorConfig).href)
  })
})

function createProjectRoot(): string {
  temporaryDirectory = mkdtempSync(path.join(tmpdir(), "ardo-project-config-"))
  const root = path.join(temporaryDirectory, "site")
  mkdirSync(root, { recursive: true })
  return root
}
