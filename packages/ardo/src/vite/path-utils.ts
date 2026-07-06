import path from "node:path"

export function resolveRoutesDir(root: string, routesDirOption: string | undefined): string {
  return path.resolve(root, routesDirOption ?? path.join("app", "routes"))
}

export function isPathInsideDirectory(filePath: string, directory: string): boolean {
  const normalizedFilePath = normalizePath(filePath)
  const normalizedDirectory = trimTrailingSlashes(normalizePath(directory))
  return (
    normalizedFilePath === normalizedDirectory ||
    normalizedFilePath.startsWith(`${normalizedDirectory}/`)
  )
}

export function normalizePath(filePath: string): string {
  return filePath.replaceAll("\\", "/")
}

function trimTrailingSlashes(value: string): string {
  let end = value.length
  while (end > 0 && value[end - 1] === "/") {
    end -= 1
  }
  return value.slice(0, end)
}
