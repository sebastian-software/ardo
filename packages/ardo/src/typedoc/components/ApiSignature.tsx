import type { ApiDocParameter, ApiDocReturn, ApiDocTypeParameter } from "../types"
import * as styles from "../../ui/components/ApiItem.css"

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
    <div className={`${styles.apiSignature} ${className}`}>
      <pre className={styles.apiSignatureCode}>
        <code>
          <span className={styles.apiKeyword}>function</span>{" "}
          <span className={styles.apiFunctionName}>{name}</span>
          {typeParamsStr && <span className={styles.apiTypeParams}>{typeParamsStr}</span>}
          <span className={styles.apiParams}>({paramsStr})</span>
          {returnStr && <span className={styles.apiReturnType}>{returnStr}</span>}
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
    <div className={styles.apiParameters}>
      <h4 className={styles.apiSectionTitle}>Parameters</h4>
      <table className={styles.apiTable}>
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
                {param.optional && <span className={styles.apiOptional}>(optional)</span>}
              </td>
              <td>
                <code>{param.type}</code>
              </td>
              <td>
                {param.description}
                {param.defaultValue && (
                  <span className={styles.apiDefault}>
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
    <div className={styles.apiReturns}>
      <h4 className={styles.apiSectionTitle}>Returns</h4>
      <p>
        <code>{returns.type}</code>
        {returns.description && <span> - {returns.description}</span>}
      </p>
    </div>
  )
}
