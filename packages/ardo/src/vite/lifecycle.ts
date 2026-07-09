export type ArdoInternalLifecyclePhase = {
  id: ArdoInternalLifecyclePhaseId
  description: string
  futurePublicCandidate: boolean
}

export type ArdoInternalLifecyclePhaseId =
  | "config:resolve"
  | "content-sources:materialize"
  | "markdown:transform"
  | "metadata:scan"
  | "outputs:emit"
  | "routes:generate"
  | "search:generate"
  | "sidebars:generate"

export const ARDO_INTERNAL_LIFECYCLE_PHASES: readonly ArdoInternalLifecyclePhase[] = [
  {
    id: "config:resolve",
    description: "Resolve user config, deployment base, versioning, i18n, and project metadata.",
    futurePublicCandidate: false,
  },
  {
    id: "content-sources:materialize",
    description: "Materialize generated or mapped content before route scanning.",
    futurePublicCandidate: true,
  },
  {
    id: "routes:generate",
    description: "Generate React Router route files from the routes directory.",
    futurePublicCandidate: true,
  },
  {
    id: "metadata:scan",
    description: "Scan route files into normalized route identity and page metadata.",
    futurePublicCandidate: true,
  },
  {
    id: "sidebars:generate",
    description: "Generate sidebar trees from normalized route metadata.",
    futurePublicCandidate: true,
  },
  {
    id: "search:generate",
    description: "Generate section-level static search records and assets.",
    futurePublicCandidate: true,
  },
  {
    id: "outputs:emit",
    description:
      "Emit static build outputs such as sitemap, redirects, llms, versions, and search.",
    futurePublicCandidate: true,
  },
  {
    id: "markdown:transform",
    description: "Apply Markdown, MDX, rehype, recma, and metadata transforms.",
    futurePublicCandidate: false,
  },
]

export function getArdoInternalLifecyclePhase(
  id: ArdoInternalLifecyclePhaseId
): ArdoInternalLifecyclePhase {
  const phase = ARDO_INTERNAL_LIFECYCLE_PHASES.find((entry) => entry.id === id)
  if (phase == null) {
    throw new Error(`[ardo] Unknown internal lifecycle phase: ${id}`)
  }

  return phase
}

export async function runArdoLifecyclePhase<T>(
  id: ArdoInternalLifecyclePhaseId,
  action: () => Promise<T> | T
): Promise<T> {
  getArdoInternalLifecyclePhase(id)
  return action()
}
