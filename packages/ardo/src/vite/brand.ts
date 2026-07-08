import path from "node:path"

import type { ArdoBrandLogo, ResolvedConfig } from "../config/types"
import type { ArdoIconOptions } from "./icons"

import { normalizePath } from "./path-utils"

type VirtualClientConfig = {
  buildHash: string | undefined
  buildTime: string
} & Pick<ResolvedConfig, "base" | "brand" | "description" | "lang" | "project" | "title">

export function resolveBrandIconOptions(
  icons: ArdoIconOptions | undefined,
  logo: ArdoBrandLogo | undefined
): ArdoIconOptions | undefined {
  if (icons === false || icons?.source !== undefined) {
    return icons
  }

  const source = getLocalLogoSource(logo)
  if (source === undefined) {
    return icons
  }

  return { ...icons, source }
}

export function serializeVirtualConfigModule(
  clientConfig: VirtualClientConfig,
  root: string
): string {
  const imports: string[] = []
  const logoExpression = serializeBrandLogo(clientConfig.brand.logo, root, imports)
  const { logo: _logo, ...brandWithoutLogo } = clientConfig.brand
  const configWithoutLogo = { ...clientConfig, brand: brandWithoutLogo }
  const lines = [...imports, `const config = ${JSON.stringify(configWithoutLogo)}`]

  if (logoExpression !== undefined) {
    lines.push(`config.brand = { ...(config.brand ?? {}), logo: ${logoExpression} }`)
  }

  lines.push("export default config")
  return lines.join("\n")
}

function getLocalLogoSource(logo: ArdoBrandLogo | undefined): string | undefined {
  const source = typeof logo === "string" ? logo : logo?.light
  return source !== undefined && isLocalAssetReference(source) ? source : undefined
}

function serializeBrandLogo(
  logo: ArdoBrandLogo | undefined,
  root: string,
  imports: string[]
): string | undefined {
  if (logo === undefined) {
    return undefined
  }

  if (typeof logo === "string") {
    return serializeAssetReference(logo, root, imports)
  }

  const light = serializeAssetReference(logo.light, root, imports)
  const dark = serializeAssetReference(logo.dark, root, imports)
  return `{ light: ${light}, dark: ${dark} }`
}

function serializeAssetReference(source: string, root: string, imports: string[]): string {
  if (!isLocalAssetReference(source)) {
    return JSON.stringify(source)
  }

  const identifier = `__ardoBrandLogo${imports.length}`
  imports.push(`import ${identifier} from ${JSON.stringify(toAssetImportPath(root, source))}`)
  return identifier
}

function isLocalAssetReference(source: string): boolean {
  return (
    !source.startsWith("/") &&
    !source.startsWith("http://") &&
    !source.startsWith("https://") &&
    !source.startsWith("data:") &&
    !source.startsWith("blob:")
  )
}

function toAssetImportPath(root: string, source: string): string {
  return normalizePath(path.resolve(root, source))
}
