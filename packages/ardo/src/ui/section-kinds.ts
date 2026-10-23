// =============================================================================
// Section Catalog
// =============================================================================

/**
 * Known documentation section kinds. A top-level route folder whose name
 * matches one of the aliases gets the kind's label and icon; any other folder
 * renders as a text-only tab. Ardo never guesses an icon.
 *
 * Icons come from `section-icons.tsx` (Streamline Core Line, see #341/#342).
 */
export type ArdoSectionKind =
  | "api"
  | "architecture"
  | "archive"
  | "changelog"
  | "cli"
  | "components"
  | "concepts"
  | "decisions"
  | "examples"
  | "getting-started"
  | "guide"
  | "how-to"
  | "integrations"
  | "migration"
  | "operations"
  | "performance"
  | "proposals"
  | "quality"
  | "reference"
  | "security"

type SectionKindDefinition = {
  kind: ArdoSectionKind
  label: string
  aliases: readonly string[]
}

/** Catalog order is the default tab order. */
const sectionKinds: readonly SectionKindDefinition[] = [
  {
    kind: "guide",
    label: "Guide",
    aliases: ["guide", "guides", "docs", "handbook", "user-guide"],
  },
  {
    kind: "getting-started",
    label: "Getting Started",
    aliases: ["getting-started", "start", "quickstart", "tutorial", "tutorials", "learn"],
  },
  {
    kind: "concepts",
    label: "Concepts",
    aliases: ["concepts", "explanation", "overview", "fundamentals"],
  },
  {
    kind: "how-to",
    label: "How-To",
    aliases: ["how-to", "howto", "recipes", "cookbook"],
  },
  {
    kind: "reference",
    label: "Reference",
    aliases: ["reference", "config", "configuration", "options"],
  },
  {
    kind: "api",
    label: "API",
    aliases: ["api", "api-reference", "openapi", "sdk"],
  },
  { kind: "cli", label: "CLI", aliases: ["cli", "commands", "terminal"] },
  {
    kind: "components",
    label: "Components",
    aliases: ["components", "ui", "widgets"],
  },
  {
    kind: "examples",
    label: "Examples",
    aliases: ["examples", "demos", "showcase", "playground", "sandbox"],
  },
  {
    kind: "integrations",
    label: "Integrations",
    aliases: ["integrations", "plugins", "extensions", "adapters"],
  },
  {
    kind: "architecture",
    label: "Architecture",
    aliases: ["architecture", "arch", "internals", "design"],
  },
  {
    kind: "performance",
    label: "Performance",
    aliases: ["perf", "performance", "benchmarks"],
  },
  {
    kind: "quality",
    label: "Quality",
    aliases: ["quality", "testing", "tests", "compatibility"],
  },
  { kind: "security", label: "Security", aliases: ["security"] },
  {
    kind: "operations",
    label: "Operations",
    aliases: ["operations", "ops", "deployment", "deploy", "runbooks", "hosting"],
  },
  {
    kind: "migration",
    label: "Migration",
    aliases: ["migration", "migrations", "upgrade", "upgrading"],
  },
  // Project history comes last: decisions, proposals, releases, archive.
  { kind: "decisions", label: "ADRs", aliases: ["adr", "adrs", "decisions"] },
  {
    kind: "proposals",
    label: "RFCs",
    aliases: ["rfc", "rfcs", "proposals", "specs"],
  },
  {
    kind: "changelog",
    label: "Changelog",
    aliases: ["changelog", "releases", "release-notes", "versions"],
  },
  {
    kind: "archive",
    label: "Archive",
    aliases: ["archive", "legacy", "deprecated"],
  },
]

const kindsByAlias = new Map(
  sectionKinds.flatMap((definition, rank) =>
    definition.aliases.map((alias) => [alias, { ...definition, rank }] as const)
  )
)

export type ArdoSectionKindMatch = {
  kind: ArdoSectionKind
  label: string
  rank: number
}

/** Resolves a route folder name (e.g. `api-reference`, `perf`) to a known kind. */
export function resolveSectionKind(sectionId: string): ArdoSectionKindMatch | undefined {
  const match = kindsByAlias.get(normalizeSectionId(sectionId))
  return match == null ? undefined : { kind: match.kind, label: match.label, rank: match.rank }
}

/** Label for a section folder: the catalog label, or the folder name in title case. */
export function resolveSectionLabel(sectionId: string): string {
  return resolveSectionKind(sectionId)?.label ?? formatSectionTitle(sectionId)
}

function normalizeSectionId(sectionId: string): string {
  return sectionId.trim().toLowerCase().replaceAll("_", "-")
}

function formatSectionTitle(sectionId: string): string {
  return sectionId.replaceAll(/[_-]/g, " ").replaceAll(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * Orders top-level section folders like the section tabs: `sidebar.sectionOrder`
 * first, then the catalog, then the folder name.
 */
export function compareSectionIds(
  sectionOrder: readonly string[] | undefined
): (left: string, right: string) => number {
  const explicitRank = new Map((sectionOrder ?? []).map((id, index) => [id, index]))
  const rank = (id: string): [number, number] => [
    explicitRank.get(id) ?? Number.MAX_SAFE_INTEGER,
    resolveSectionKind(id)?.rank ?? Number.MAX_SAFE_INTEGER,
  ]
  return (left, right) => {
    const [leftExplicit, leftCatalog] = rank(left)
    const [rightExplicit, rightCatalog] = rank(right)
    return leftExplicit - rightExplicit || leftCatalog - rightCatalog || left.localeCompare(right)
  }
}
