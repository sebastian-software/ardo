export type Manifest = {
  name?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  peerDependenciesMeta?: Record<string, { optional?: boolean }>
}

export type PackageOwner = { root: string; manifest: Manifest }

export function importedPackageName(id: string): string | undefined {
  if (/^(?:[./#\0]|[\w-]+:)/u.test(id)) return undefined
  const specifier = id.split(/[?#]/u, 1)[0] ?? id
  return specifier
    .split("/")
    .slice(0, specifier.startsWith("@") ? 2 : 1)
    .join("/")
}

export function dependencyNames(owner: PackageOwner, projectRoot: string): string[] {
  return Object.keys({
    ...owner.manifest.dependencies,
    ...owner.manifest.peerDependencies,
    ...owner.manifest.optionalDependencies,
    ...(owner.root === projectRoot ? owner.manifest.devDependencies : {}),
  })
}

export function isOptional(manifest: Manifest, name: string): boolean {
  return (
    manifest.optionalDependencies?.[name] != null ||
    manifest.peerDependenciesMeta?.[name]?.optional === true
  )
}
