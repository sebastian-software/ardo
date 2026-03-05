import type { JSX } from "react"

import type { ApiDocItem, ApiDocKind } from "../types"

import * as styles from "../../ui/components/ApiItem.css"
import { ApiParametersTable, ApiReturns, ApiSignature } from "./ApiSignature"

interface ApiItemProps {
  item: ApiDocItem
  level?: number
}

export function ApiItem({ item, level = 2 }: ApiItemProps) {
  const HeadingTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements

  return (
    <div className={styles.apiItem} id={item.id}>
      <ApiItemHeader headingTag={HeadingTag} id={item.id} kind={item.kind} name={item.name} />
      <ApiItemDescription description={item.description} />
      <ApiItemSignature item={item} />
      <ApiItemParameters parameters={item.parameters} />
      <ApiItemReturns returns={item.returns} />
      <ApiExamples examples={item.examples} itemId={item.id} />
      <ApiSourceSection source={item.source} />
      <ApiChildren childItems={item.children} level={level} />
    </div>
  )
}

function ApiItemDescription(params: { description: string | undefined }) {
  const { description } = params
  const hasDescription = description != null && description.length > 0
  if (!hasDescription) {
    return null
  }
  return <p className={styles.apiItemDescription}>{description}</p>
}

function ApiItemSignature(params: { item: ApiDocItem }) {
  const { item } = params
  const hasSignature = item.signature != null && item.signature.length > 0
  if (!hasSignature) {
    return null
  }

  return (
    <ApiSignature
      name={item.name}
      typeParameters={item.typeParameters}
      parameters={item.parameters}
      returns={item.returns}
    />
  )
}

function ApiItemParameters(params: { parameters: ApiDocItem["parameters"] }) {
  const { parameters } = params
  if (parameters == null || parameters.length === 0) {
    return null
  }
  return <ApiParametersTable parameters={parameters} />
}

function ApiItemReturns(params: { returns: ApiDocItem["returns"] }) {
  const { returns } = params
  if (returns == null) {
    return null
  }
  return <ApiReturns returns={returns} />
}

function ApiItemHeader(params: {
  headingTag: keyof JSX.IntrinsicElements
  id: string
  kind: ApiDocKind
  name: string
}) {
  const { headingTag: HeadingTag, id, kind, name } = params

  return (
    <HeadingTag className={styles.apiItemTitle}>
      <ApiKindBadge kind={kind} />
      <span className={styles.apiItemName}>{name}</span>
      <a href={`#${id}`} className={styles.apiAnchor}>
        #
      </a>
    </HeadingTag>
  )
}

function ApiExamples(params: { examples: null | string[] | undefined; itemId: string }) {
  const { examples, itemId } = params
  if (examples == null || examples.length === 0) {
    return null
  }

  return (
    <div className={styles.apiExamples}>
      <h4 className={styles.apiSectionTitle}>Examples</h4>
      {examples.map((example) => (
        <pre key={`${itemId}-${example}`} className={styles.apiExample}>
          <code>{example}</code>
        </pre>
      ))}
    </div>
  )
}

function ApiSourceSection(params: { source: ApiDocItem["source"] }) {
  const { source } = params
  if (source == null) {
    return null
  }

  const hasSourceUrl = source.url != null && source.url.length > 0

  return (
    <div className={styles.apiSource}>
      {hasSourceUrl ? (
        <a href={source.url} target="_blank" rel="noopener noreferrer">
          {source.file}:{source.line}
        </a>
      ) : (
        <span>
          {source.file}:{source.line}
        </span>
      )}
    </div>
  )
}

function ApiChildren(params: { childItems: ApiDocItem["children"]; level: number }) {
  const { childItems, level } = params
  if (childItems == null || childItems.length === 0) {
    return null
  }

  return (
    <div className={styles.apiChildren}>
      {childItems.map((child) => (
        <ApiItem key={child.id} item={child} level={level + 1} />
      ))}
    </div>
  )
}

interface ApiKindBadgeProps {
  kind: ApiDocKind
}

const badgeKinds: Record<
  string,
  NonNullable<NonNullable<Parameters<typeof styles.apiBadge>[0]>["kind"]>
> = {
  class: "class",
  interface: "interface",
  type: "type",
  enum: "enum",
  function: "function",
  method: "method",
  property: "property",
}

export function ApiKindBadge({ kind }: ApiKindBadgeProps) {
  const kindLabels: Record<ApiDocKind, string> = {
    module: "Module",
    namespace: "Namespace",
    class: "Class",
    interface: "Interface",
    type: "Type",
    enum: "Enum",
    function: "Function",
    variable: "Variable",
    property: "Property",
    method: "Method",
    accessor: "Accessor",
    constructor: "Constructor",
    parameter: "Parameter",
    typeParameter: "Type Parameter",
    enumMember: "Enum Member",
  }

  return <span className={styles.apiBadge({ kind: badgeKinds[kind] })}>{kindLabels[kind]}</span>
}

interface ApiHierarchyProps {
  hierarchy: ApiDocItem["hierarchy"]
}

interface HierarchyEntry {
  label: string
  types: string[]
}

export function ApiHierarchy({ hierarchy }: ApiHierarchyProps) {
  if (hierarchy == null) {
    return null
  }

  const entries = collectHierarchyEntries(hierarchy)
  if (entries.length === 0) {
    return null
  }

  return (
    <div className={styles.apiHierarchy}>
      <h4 className={styles.apiSectionTitle}>Hierarchy</h4>
      <ul className={styles.apiHierarchyList}>
        {entries.flatMap((entry) =>
          entry.types.map((type) => (
            <li key={`${entry.label}-${type}`}>
              <span className={styles.apiHierarchyLabel}>{entry.label}</span>
              <code>{type}</code>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

function collectHierarchyEntries(
  hierarchy: NonNullable<ApiDocItem["hierarchy"]>
): HierarchyEntry[] {
  const entries: HierarchyEntry[] = []

  appendHierarchyEntry(entries, "extends", hierarchy.extends)
  appendHierarchyEntry(entries, "implements", hierarchy.implements)
  appendHierarchyEntry(entries, "extended by", hierarchy.extendedBy)
  appendHierarchyEntry(entries, "implemented by", hierarchy.implementedBy)

  return entries
}

function appendHierarchyEntry(
  entries: HierarchyEntry[],
  label: string,
  types: string[] | undefined
): void {
  if (types != null && types.length > 0) {
    entries.push({ label, types })
  }
}
