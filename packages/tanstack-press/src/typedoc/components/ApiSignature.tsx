import type { ApiDocParameter, ApiDocReturn, ApiDocTypeParameter } from '../types'

interface ApiSignatureProps {
  name: string
  typeParameters?: ApiDocTypeParameter[]
  parameters?: ApiDocParameter[]
  returns?: ApiDocReturn
  className?: string
}

export function ApiSignature({
  name,
  typeParameters,
  parameters,
  returns,
  className = '',
}: ApiSignatureProps) {
  const typeParamsStr = typeParameters?.length
    ? `<${typeParameters.map((tp) => tp.name).join(', ')}>`
    : ''

  const paramsStr = parameters
    ?.map((p) => {
      const optional = p.optional ? '?' : ''
      return `${p.name}${optional}: ${p.type}`
    })
    .join(', ')

  const returnStr = returns?.type ? `: ${returns.type}` : ''

  return (
    <div className={`press-api-signature ${className}`}>
      <pre className="press-api-signature-code">
        <code>
          <span className="press-api-keyword">function</span>{' '}
          <span className="press-api-function-name">{name}</span>
          {typeParamsStr && <span className="press-api-type-params">{typeParamsStr}</span>}
          <span className="press-api-params">({paramsStr})</span>
          {returnStr && <span className="press-api-return-type">{returnStr}</span>}
        </code>
      </pre>
    </div>
  )
}

interface ApiParametersTableProps {
  parameters: ApiDocParameter[]
}

export function ApiParametersTable({ parameters }: ApiParametersTableProps) {
  if (!parameters.length) return null

  return (
    <div className="press-api-parameters">
      <h4 className="press-api-section-title">Parameters</h4>
      <table className="press-api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((param) => (
            <tr key={param.name}>
              <td>
                <code>{param.name}</code>
                {param.optional && <span className="press-api-optional">(optional)</span>}
              </td>
              <td>
                <code>{param.type}</code>
              </td>
              <td>
                {param.description}
                {param.defaultValue && (
                  <span className="press-api-default">
                    Default: <code>{param.defaultValue}</code>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface ApiReturnsProps {
  returns: ApiDocReturn
}

export function ApiReturns({ returns }: ApiReturnsProps) {
  return (
    <div className="press-api-returns">
      <h4 className="press-api-section-title">Returns</h4>
      <p>
        <code>{returns.type}</code>
        {returns.description && <span> - {returns.description}</span>}
      </p>
    </div>
  )
}
