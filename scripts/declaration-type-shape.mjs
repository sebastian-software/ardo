const standardArrays = ["Array", "ReadonlyArray"]
const trivia = new Set(["start", "end", "raw"])

/** Compare syntax, with an optional bounded normalization of presentation. */
export function typeShape(value, { normalize = false, arrayNames = standardArrays } = {}) {
  const visit = (node) => {
    if (Array.isArray(node)) return node.map(visit)
    if (node == null || typeof node !== "object") return node
    if (node.type === "TSParenthesizedType") return visit(node.typeAnnotation)
    if (
      normalize &&
      node.type === "TSTypeReference" &&
      node.typeName.type === "Identifier" &&
      arrayNames.includes(node.typeName.name) &&
      node.typeArguments?.params.length === 1
    ) {
      const array = { type: "TSArrayType", elementType: node.typeArguments.params[0] }
      return visit(
        node.typeName.name === "ReadonlyArray"
          ? { type: "TSTypeOperator", operator: "readonly", typeAnnotation: array }
          : array
      )
    }
    const result = Object.fromEntries(
      Object.entries(node)
        .filter(([key]) => !trivia.has(key))
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, visit(item)])
    )
    if (normalize && node.type === "TSTypeLiteral" && sortableProperties(node.members))
      result.members.sort(compareNodes)
    if (normalize && node.type === "TSUnionType" && node.types.every(atomicType))
      result.types.sort(compareNodes)
    return result
  }
  return visit(value)
}

function atomicType(node) {
  return node.type === "TSLiteralType" || node.type.endsWith("Keyword")
}

function sortableProperties(members) {
  if (!members.every((member) => member.type === "TSPropertySignature" && !member.computed))
    return false
  const names = members.map((member) => propertyName(member.key))
  if (names.includes(undefined)) return false
  return new Set(names).size === names.length
}

function propertyName(key) {
  if (key.type === "Identifier") return key.name
  if (key.type === "Literal") return String(key.value)
  return undefined
}

function compareNodes(left, right) {
  return JSON.stringify(left).localeCompare(JSON.stringify(right))
}

/** Disable each array-name rewrite if any non-library input binds that name. */
export function globalArrayNames(programs) {
  const shadowed = new Set()
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit)
    if (node == null || typeof node !== "object") return
    const name = bindingName(node)
    if (standardArrays.includes(name)) shadowed.add(name)
    Object.values(node).forEach(visit)
  }
  programs.forEach(visit)
  return standardArrays.filter((name) => !shadowed.has(name))
}

function bindingName(node) {
  if (node.type === "TSTypeParameter") return node.name.name
  if (node.type?.startsWith("Import") && node.local != null) return node.local.name
  if (
    [
      "TSTypeAliasDeclaration",
      "TSInterfaceDeclaration",
      "ClassDeclaration",
      "TSImportEqualsDeclaration",
    ].includes(node.type)
  )
    return node.id?.name
  return undefined
}
