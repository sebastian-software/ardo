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
  const typeParamsStr = getTypeParametersText(typeParameters)
  const paramsStr = getParametersText(parameters)
  const returnStr = getReturnText(returns)

  return (
    <div className={`${styles.apiSignature} ${className}`}>
      <pre className={styles.apiSignatureCode}>
        <code>
          <span className={styles.apiKeyword}>function</span>{" "}
          <span className={styles.apiFunctionName}>{name}</span>
          {typeParamsStr.length > 0 ? (
            <span className={styles.apiTypeParams}>{typeParamsStr}</span>
          ) : null}
          <span className={styles.apiParams}>({paramsStr})</span>
          {returnStr.length > 0 ? <span className={styles.apiReturnType}>{returnStr}</span> : null}
        </code>
      </pre>
    </div>
  )
}

function getTypeParametersText(typeParameters: ApiDocTypeParameter[] | undefined): string {
  if (typeParameters == null || typeParameters.length === 0) {
    return ""
  }

  return `<${typeParameters.map((typeParameter) => typeParameter.name).join(", ")}>`
}

function getParametersText(parameters: ApiDocParameter[] | undefined): string {
  if (parameters == null || parameters.length === 0) {
    return ""
  }

  return parameters
    .map((parameter) => {
      const optional = parameter.optional ? "?" : ""
      return `${parameter.name}${optional}: ${parameter.type}`
    })
    .join(", ")
}

function getReturnText(returns: ApiDocReturn | undefined): string {
  if (returns?.type == null || returns.type.length === 0) {
    return ""
  }

  return `: ${returns.type}`
}

interface ApiParametersTableProps {
  parameters: ApiDocParameter[]
}

export function ApiParametersTable({ parameters }: ApiParametersTableProps) {
  if (parameters.length === 0) return null

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
          {parameters.map((param) => {
            const hasDescription = param.description != null && param.description.length > 0
            const hasDefaultValue = param.defaultValue != null && param.defaultValue.length > 0

            return (
              <tr key={param.name}>
                <td>
                  <code>{param.name}</code>
                  {param.optional ? <span className={styles.apiOptional}>(optional)</span> : null}
                </td>
                <td>
                  <code>{param.type}</code>
                </td>
                <td>
                  {hasDescription ? param.description : null}
                  {hasDefaultValue ? (
                    <span className={styles.apiDefault}>
                      Default: <code>{param.defaultValue}</code>
                    </span>
                  ) : null}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

interface ApiReturnsProps {
  returns: ApiDocReturn
}

export function ApiReturns({ returns }: ApiReturnsProps) {
  const hasDescription = returns.description != null && returns.description.length > 0

  return (
    <div className={styles.apiReturns}>
      <h4 className={styles.apiSectionTitle}>Returns</h4>
      <p>
        <code>{returns.type}</code>
        {hasDescription ? <span> - {returns.description}</span> : null}
      </p>
    </div>
  )
}
