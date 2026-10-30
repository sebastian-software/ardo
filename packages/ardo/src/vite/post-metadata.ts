import fs from "node:fs/promises"
import path from "node:path"
import type { PostImageInput } from "../publication/types"
import type { PublicationContext } from "./publication-context"

export type PostMetadata = {
  id: string
  title: string
  description?: string
  publishedAt: string
  updatedAt?: string
  routePath: string
  authorKeys: string[]
  tags: string[]
  draft: boolean
}

export function parsePostMetadata(
  data: Record<string, unknown>,
  sourceFile: string,
  context: PublicationContext
): PostMetadata {
  const metadata: PostMetadata = {
    id: requiredString(data, "id"),
    title: requiredString(data, "title"),
    description: optionalString(data.description, "description"),
    publishedAt: readDate(data.publishedAt, "publishedAt"),
    updatedAt: data.updatedAt == null ? undefined : readDate(data.updatedAt, "updatedAt"),
    routePath: postPath(data, sourceFile, context),
    authorKeys: stringArray(data.authors, "authors"),
    tags: data.tags == null ? [] : stringArray(data.tags, "tags"),
    draft: data.draft === true,
  }
  validateLifecycle(metadata, data.draft)
  checkIdentity(metadata, context)
  return metadata
}

function postPath(
  data: Record<string, unknown>,
  sourceFile: string,
  context: PublicationContext
): string {
  const relative = path
    .relative(context.sourceDir, sourceFile)
    .replaceAll("\\", "/")
    .replace(/\.(md|mdx)$/u, "")
    .replace(/(?:^|\/)(?:index|home)$/u, "")
  const result =
    typeof data.path === "string" ? data.path.replace(/\/$/u, "") : `/${context.prefix}/${relative}`
  validatePostPath(result, `/${context.prefix}`)
  return result
}

function validateLifecycle(metadata: PostMetadata, draft: unknown): void {
  if (metadata.updatedAt != null && metadata.updatedAt < metadata.publishedAt)
    throw new Error("updatedAt cannot precede publishedAt.")
  if (draft != null && typeof draft !== "boolean") throw new Error("draft must be a boolean.")
  if (metadata.authorKeys.length === 0)
    throw new Error("Every post needs at least one author reference.")
}

function checkIdentity(metadata: PostMetadata, context: PublicationContext): void {
  if (context.seenIds.has(metadata.id))
    throw new Error(
      `Duplicate post id ${JSON.stringify(metadata.id)}. IDs must remain unique across source paths, including drafts.`
    )
  if (context.seenPaths.has(metadata.routePath))
    throw new Error(`Duplicate post path ${metadata.routePath}.`)
  context.seenIds.add(metadata.id)
  context.seenPaths.add(metadata.routePath)
}

export async function readPostFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await readPostFiles(file)))
    else if (entry.isFile() && /\.mdx?$/u.test(entry.name)) files.push(file)
  }
  return files
}

function requiredString(data: Record<string, unknown>, field: string): string {
  const value = data[field]
  if (typeof value !== "string" || value.trim() === "")
    throw new Error(`${field} must be a non-empty string.`)
  return value
}
export function optionalString(value: unknown, field: string): string | undefined {
  if (value == null) return undefined
  if (typeof value !== "string") throw new Error(`${field} must be a string.`)
  return value
}
export function stringArray(value: unknown, field: string): string[] {
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string" || entry.trim() === "")
  )
    throw new Error(`${field} must be an array of non-empty strings.`)
  return value
}
export function record(value: unknown, field: string): Record<string, unknown> {
  if (value == null) return {}
  if (typeof value !== "object" || Array.isArray(value))
    throw new Error(`${field} must be a mapping.`)
  return value as Record<string, unknown>
}
function readDate(value: unknown, field: string): string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/u.test(value) ||
    !Number.isFinite(Date.parse(value))
  )
    throw new Error(`${field} must be an RFC 3339 timestamp with a time zone.`)
  const [year, month, day] = value.slice(0, 10).split("-").map(Number)
  if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate())
    throw new Error(`${field} must contain a valid calendar date.`)
  return new Date(value).toISOString()
}
export function readCoverImage(value: unknown): PostImageInput {
  const image = record(value, "coverImage")
  if (typeof image.src !== "string" || typeof image.alt !== "string")
    throw new Error("coverImage requires src and alt.")
  return image as PostImageInput
}
function validatePostPath(value: string, prefix: string): void {
  if (
    !value.startsWith(`${prefix}/`) ||
    value.includes("\\") ||
    /[?#%:]/u.test(value) ||
    value.split("/").some((part) => part === "." || part === ".." || part.startsWith("_")) ||
    path.posix.normalize(value) !== value ||
    value.endsWith("/")
  )
    throw new Error(`Post path must identify a static page inside ${prefix}: ${value}`)
}
