import { resolveGeneratedDocsDirectory } from "../generated-docs"
import { isPathInsideDirectory } from "./path-utils"

export function validateApiOutputs(routesDir: string, outputs: string[]): void {
  // Keep output ownership portable across case-insensitive filesystems.
  const directories = outputs.map((out) =>
    resolveGeneratedDocsDirectory(routesDir, out, "api.out").normalize("NFC").toLowerCase()
  )
  for (let index = 0; index < directories.length; index++) {
    for (const other of directories.slice(index + 1)) {
      const directory = directories[index]
      if (isPathInsideDirectory(directory, other) || isPathInsideDirectory(other, directory))
        throw new Error(
          "[ardo] API projects must use distinct, non-overlapping api.out directories."
        )
    }
  }
}
