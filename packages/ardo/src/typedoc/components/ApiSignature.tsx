import type { ApiDocParameter, ApiDocReturn, ApiDocTypeParameter } from "../types"

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
  className = "",
}: ApiSignatureProps) {
  const typeParamsStr = typeParameters?.length
    ? `<${typeParameters.map((tp) => tp.name).join(", ")}>`
    : ""

  const paramsStr = parameters
    ?.map((p) => {
      const optional = p.optional ? "?" : ""
      return `${p.name}${optional}: ${p.type}`
    })
    .join(", ")

  const returnStr = returns?.type ? `: ${returns.type}` : ""

  return (
    <div className={`ardo-api-signature ${className}`}>
      <pre className="ardo-api-signature-code">
        <code>
          <span className="ardo-api-keyword">function</span>{" "}
          <span className="ardo-api-function-name">{name}</span>
          {typeParamsStr && <span className="ardo-api-type-params">{typeParamsStr}</span>}
          <span className="ardo-api-params">({paramsStr})</span>
          {returnStr && <span className="ardo-api-return-type">{returnStr}</span>}
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
    <div className="ardo-api-parameters">
      <h4 className="ardo-api-section-title">Parameters</h4>
      <table className="ardo-api-table">
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
                {param.optional && <span className="ardo-api-optional">(optional)</span>}
              </td>
              <td>
                <code>{param.type}</code>
              </td>
              <td>
                {param.description}
                {param.defaultValue && (
                  <span className="ardo-api-default">
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
    <div className="ardo-api-returns">
      <h4 className="ardo-api-section-title">Returns</h4>
      <p>
        <code>{returns.type}</code>
        {returns.description && <span> - {returns.description}</span>}
      </p>
    </div>
  )
}
