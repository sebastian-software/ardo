import type { Plugin } from "vite"

import fs from "node:fs"
import path from "node:path"

import { copyRecursive } from "./git-utils"

let flattenExecuted = false

export function createFlattenPlugin(): Plugin {
  let detectedBase: string | undefined

  return {
    name: "ardo:flatten-github-pages",
    enforce: "post",
    configResolved(config) {
      detectedBase = config.base === "/" ? undefined : config.base
    },
    closeBundle() {
      if (flattenExecuted || detectedBase == null) {
        return
      }

      const baseName = trimSlashes(detectedBase)
      if (baseName === "") {
        return
      }

      const buildDir = path.join(process.cwd(), "build", "client")
      const nestedDir = path.join(buildDir, baseName)
      if (!fs.existsSync(nestedDir)) {
        return
      }

      console.log(`[ardo] Flattening build/client/${baseName}/ to build/client/ for GitHub Pages`)
      copyRecursive(nestedDir, buildDir)
      fs.rmSync(nestedDir, { recursive: true, force: true })
      console.log("[ardo] Build output flattened successfully.")
      flattenExecuted = true
    },
  }
}

function trimSlashes(value: string): string {
  let trimmed = value

  while (trimmed.startsWith("/")) {
    trimmed = trimmed.slice(1)
  }

  while (trimmed.endsWith("/")) {
    trimmed = trimmed.slice(0, -1)
  }

  return trimmed
}
