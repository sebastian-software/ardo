export const MINIMUM_NODE_VERSION = "22.22.1"

export function assertSupportedNodeVersion(version = process.versions.node): void {
  if (isSupportedNodeVersion(version)) {
    return
  }

  throw new Error(
    `create-ardo requires Node.js ${MINIMUM_NODE_VERSION} or higher. Current version: ${version}. Please upgrade Node.js and try again.`
  )
}

export function isSupportedNodeVersion(version: string): boolean {
  return compareNodeVersion(version, MINIMUM_NODE_VERSION) >= 0
}

function compareNodeVersion(left: string, right: string): number {
  const leftParts = parseNodeVersion(left)
  const rightParts = parseNodeVersion(right)

  for (const index of [0, 1, 2] as const) {
    const difference = leftParts[index] - rightParts[index]
    if (difference !== 0) {
      return difference
    }
  }

  return 0
}

function parseNodeVersion(version: string): [number, number, number] {
  const parts = version.replace(/^v/, "").split(".")

  return [parseVersionPart(parts[0]), parseVersionPart(parts[1]), parseVersionPart(parts[2])]
}

function parseVersionPart(part: string | undefined): number {
  const value = Number.parseInt(part ?? "0", 10)
  return Number.isNaN(value) ? 0 : value
}
