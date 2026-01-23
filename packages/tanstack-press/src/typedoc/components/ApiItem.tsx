import type { ApiDocItem, ApiDocKind } from '../types'
import { ApiSignature, ApiParametersTable, ApiReturns } from './ApiSignature'
import type { JSX } from 'react'

interface ApiItemProps {
  item: ApiDocItem
  level?: number
}

export function ApiItem({ item, level = 2 }: ApiItemProps) {
  const HeadingTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements

  return (
    <div className={`press-api-item press-api-item-${item.kind}`} id={item.id}>
      <HeadingTag className="press-api-item-title">
        <ApiKindBadge kind={item.kind} />
        <span className="press-api-item-name">{item.name}</span>
        <a href={`#${item.id}`} className="press-api-anchor">
          #
        </a>
      </HeadingTag>

      {item.description && <p className="press-api-item-description">{item.description}</p>}

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
        <div className="press-api-examples">
          <h4 className="press-api-section-title">Examples</h4>
          {item.examples.map((example, i) => (
            <pre key={i} className="press-api-example">
              <code>{example}</code>
            </pre>
          ))}
        </div>
      )}

      {item.source && (
        <div className="press-api-source">
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
        <div className="press-api-children">
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

export function ApiKindBadge({ kind }: ApiKindBadgeProps) {
  const kindLabels: Record<ApiDocKind, string> = {
    module: 'Module',
    namespace: 'Namespace',
    class: 'Class',
    interface: 'Interface',
    type: 'Type',
    enum: 'Enum',
    function: 'Function',
    variable: 'Variable',
    property: 'Property',
    method: 'Method',
    accessor: 'Accessor',
    constructor: 'Constructor',
    parameter: 'Parameter',
    typeParameter: 'Type Parameter',
    enumMember: 'Enum Member',
  }

  const kindColors: Record<string, string> = {
    class: 'press-api-badge-class',
    interface: 'press-api-badge-interface',
    type: 'press-api-badge-type',
    enum: 'press-api-badge-enum',
    function: 'press-api-badge-function',
    method: 'press-api-badge-method',
    property: 'press-api-badge-property',
  }

  return <span className={`press-api-badge ${kindColors[kind] || ''}`}>{kindLabels[kind]}</span>
}

interface ApiHierarchyProps {
  hierarchy: ApiDocItem['hierarchy']
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
    <div className="press-api-hierarchy">
      <h4 className="press-api-section-title">Hierarchy</h4>
      <ul className="press-api-hierarchy-list">
        {extendsTypes?.map((type) => (
          <li key={type}>
            <span className="press-api-hierarchy-label">extends</span>
            <code>{type}</code>
          </li>
        ))}
        {implementsTypes?.map((type) => (
          <li key={type}>
            <span className="press-api-hierarchy-label">implements</span>
            <code>{type}</code>
          </li>
        ))}
        {extendedBy?.map((type) => (
          <li key={type}>
            <span className="press-api-hierarchy-label">extended by</span>
            <code>{type}</code>
          </li>
        ))}
        {implementedBy?.map((type) => (
          <li key={type}>
            <span className="press-api-hierarchy-label">implemented by</span>
            <code>{type}</code>
          </li>
        ))}
      </ul>
    </div>
  )
}
