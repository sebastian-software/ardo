import { describe, expect, it } from "vitest"

import { detectPackageManager, getPackageManagerCommands } from "./package-manager"

describe("detectPackageManager", () => {
  it.each([
    ["pnpm/11.2.2 npm/? node/v24.0.0", "pnpm"],
    ["npm/11.0.0 node/v24.0.0", "npm"],
    ["yarn/4.0.0 npm/? node/v24.0.0", "yarn"],
    ["bun/1.2.0 npm/? node/v24.0.0", "bun"],
    [undefined, "pnpm"],
  ] as const)("detects %s as %s", (userAgent, expected) => {
    expect(detectPackageManager(userAgent)).toBe(expected)
  })
})

describe("getPackageManagerCommands", () => {
  it("uses package-manager specific run commands", () => {
    expect(getPackageManagerCommands("npm").dev).toBe("npm run dev")
    expect(getPackageManagerCommands("yarn").workflowInstall).toBe("yarn install --immutable")
    expect(getPackageManagerCommands("bun").workflowSetup).toContain("oven-sh/setup-bun")
  })
})
