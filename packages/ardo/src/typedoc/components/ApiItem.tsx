import type { ApiDocItem, ApiDocKind } from "../types"
import { ApiSignature, ApiParametersTable, ApiReturns } from "./ApiSignature"
import type { JSX } from "react"
import * as styles from "../../ui/components/ApiItem.css"

interface ApiItemProps {
  item: ApiDocItem
  level?: number
}

export function ApiItem({ item, level = 2 }: ApiItemProps) {
  const HeadingTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements

  return (
    <div className={styles.apiItem} id={item.id}>
      <HeadingTag className={styles.apiItemTitle}>
        <ApiKindBadge kind={item.kind} />
        <span className={styles.apiItemName}>{item.name}</span>
        <a href={`#${item.id}`} className={styles.apiAnchor}>
          #
        </a>
      </HeadingTag>

      {item.description && <p className={styles.apiItemDescription}>{item.description}</p>}

      {item.signature && (
        <ApiSignature
          name={item.name}
          typeParameters={item.typeParameters}
          parameters={item.parameters}
          returns={item.returns}
        />
      )}

      {item.parameters && item.parameters.length > 0 && (
        <ApiParametersTable parameters={item.parameters} />
      )}

      {item.returns && <ApiReturns returns={item.returns} />}

      {item.examples && item.examples.length > 0 && (
        <div className={styles.apiExamples}>
          <h4 className={styles.apiSectionTitle}>Examples</h4>
          {item.examples.map((example, i) => (
            <pre key={i} className={styles.apiExample}>
              <code>{example}</code>
            </pre>
          ))}
        </div>
      )}

      {item.source && (
        <div className={styles.apiSource}>
          {item.source.url ? (
            <a href={item.source.url} target="_blank" rel="noopener noreferrer">
              {item.source.file}:{item.source.line}
            </a>
          ) : (
            <span>
              {item.source.file}:{item.source.line}
            </span>
          )}
        </div>
      )}

      {item.children && item.children.length > 0 && (
        <div className={styles.apiChildren}>
          {item.children.map((child) => (
            <ApiItem key={child.id} item={child} level={level + 1} />
          ))}
        </div>
      )}
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

export function ApiHierarchy({ hierarchy }: ApiHierarchyProps) {
  if (!hierarchy) return null

  const {
    extends: extendsTypes,
    implements: implementsTypes,
    extendedBy,
    implementedBy,
  } = hierarchy

  if (
    !extendsTypes?.length &&
    !implementsTypes?.length &&
    !extendedBy?.length &&
    !implementedBy?.length
  ) {
    return null
  }

  return (
    <div className={styles.apiHierarchy}>
      <h4 className={styles.apiSectionTitle}>Hierarchy</h4>
      <ul className={styles.apiHierarchyList}>
        {extendsTypes?.map((type) => (
          <li key={type}>
            <span className={styles.apiHierarchyLabel}>extends</span>
            <code>{type}</code>
          </li>
        ))}
        {implementsTypes?.map((type) => (
          <li key={type}>
            <span className={styles.apiHierarchyLabel}>implements</span>
            <code>{type}</code>
          </li>
        ))}
        {extendedBy?.map((type) => (
          <li key={type}>
            <span className={styles.apiHierarchyLabel}>extended by</span>
            <code>{type}</code>
          </li>
        ))}
        {implementedBy?.map((type) => (
          <li key={type}>
            <span className={styles.apiHierarchyLabel}>implemented by</span>
            <code>{type}</code>
          </li>
        ))}
      </ul>
    </div>
  )
}
