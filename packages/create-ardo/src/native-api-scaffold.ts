import fs from "node:fs"
import path from "node:path"

import type { PackageManager } from "./package-manager"

const NATIVE_TYPESCRIPT_VERSION = "7.1.0-dev.20261011.1"

export const nativeApiDependencies = {
  "@typescript/native": `npm:typescript@${NATIVE_TYPESCRIPT_VERSION}`,
  "oxc-parser": "^0.127.0",
}

export function writeNativeApiScaffold(
  root: string,
  options: {
    overwriteExisting: boolean
    packageManager: PackageManager
    writeWorkspace: boolean
  }
): void {
  const files = new Map([
    [
      "tsconfig.api.json",
      `${JSON.stringify({ extends: "./tsconfig.json", files: ["src/index.ts"], include: [] }, null, 2)}\n`,
    ],
    [
      "src/index.ts",
      '/** Create a greeting for a library consumer. */\nexport function greet(name: string): string {\n  return "Hello, " + name + "!"\n}\n',
    ],
  ])
  for (const [file, content] of files) {
    const destination = path.join(root, file)
    if (!options.overwriteExisting && fs.existsSync(destination)) continue
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    fs.writeFileSync(destination, content)
  }
  if (options.packageManager === "pnpm" && options.writeWorkspace) {
    const packages = [
      "typescript",
      ...[
        "darwin-arm64",
        "darwin-x64",
        "linux-arm",
        "linux-arm64",
        "linux-x64",
        "win32-arm64",
        "win32-x64",
      ].map((platform) => `@typescript/typescript-${platform}`),
    ]
    fs.appendFileSync(
      path.join(root, "pnpm-workspace.yaml"),
      `\nminimumReleaseAgeExclude:\n${packages.map((name) => `  - ${JSON.stringify(`${name}@${NATIVE_TYPESCRIPT_VERSION}`)}`).join("\n")}\n`
    )
  }
}
