/**
 * Recma plugin that wraps the MDX default export with ArdoPageDataProvider
 * to inject frontmatter + toc into the React context for TOC and content.
 */

// eslint-disable-next-line @cspell/spellchecker
interface EstreeProgram {
  type: string
  body: EstreeNode[]
}

interface EstreeNode {
  type: string
  declaration?: EstreeNode
  id?: { type?: string; name: string }
  [key: string]: unknown
}

function findDefaultExport(body: EstreeNode[]): { index: number; name: string } {
  for (let i = 0; i < body.length; i++) {
    const node = body[i]
    if (
      node.type === "ExportDefaultDeclaration" &&
      node.declaration?.type === "FunctionDeclaration" &&
      node.declaration.id?.name !== undefined &&
      node.declaration.id.name !== ""
    ) {
      return { index: i, name: node.declaration.id.name }
    }
  }
  return { index: -1, name: "" }
}

function createImport(imported: string, local: string, source: string): EstreeNode {
  return {
    type: "ImportDeclaration",
    specifiers: [
      {
        type: "ImportSpecifier",
        imported: { type: "Identifier", name: imported },
        local: { type: "Identifier", name: local },
      },
    ],
    source: { type: "Literal", value: source },
  }
}

function createShorthandProp(name: string): EstreeNode {
  return {
    type: "Property",
    key: { type: "Identifier", name },
    value: { type: "Identifier", name },
    kind: "init",
    shorthand: true,
    computed: false,
    method: false,
  }
}

function createWrapperFunction(fnName: string): EstreeNode {
  return {
    type: "FunctionDeclaration",
    id: { type: "Identifier", name: "_ArdoWrapped" },
    params: [{ type: "Identifier", name: "props" }],
    body: {
      type: "BlockStatement",
      body: [
        {
          type: "ReturnStatement",
          argument: {
            type: "CallExpression",
            callee: { type: "Identifier", name: "_ardoJsx" },
            arguments: [
              { type: "Identifier", name: "_ArdoPageDP" },
              {
                type: "ObjectExpression",
                properties: [
                  createShorthandProp("frontmatter"),
                  createShorthandProp("toc"),
                  {
                    type: "Property",
                    key: { type: "Identifier", name: "children" },
                    value: {
                      type: "CallExpression",
                      callee: { type: "Identifier", name: "_ardoJsx" },
                      arguments: [
                        { type: "Identifier", name: fnName },
                        { type: "Identifier", name: "props" },
                      ],
                      optional: false,
                    },
                    kind: "init",
                    shorthand: false,
                    computed: false,
                    method: false,
                  },
                ],
              },
            ],
            optional: false,
          },
        },
      ],
    },
    generator: false,
    async: false,
  }
}

// eslint-disable-next-line @cspell/spellchecker
export function recmaWrapExport() {
  return (tree: EstreeProgram) => {
    const { index, name } = findDefaultExport(tree.body)
    if (index === -1) return

    // Remove `export default` — keep just the function declaration
    const decl = tree.body[index].declaration
    if (decl == null) return
    tree.body[index] = decl

    // Add imports, wrapper, and new default export
    tree.body.unshift(
      createImport("ArdoPageDataProvider", "_ArdoPageDP", "ardo/runtime"),
      createImport("jsx", "_ardoJsx", "react/jsx-runtime")
    )
    tree.body.push(createWrapperFunction(name), {
      type: "ExportDefaultDeclaration",
      declaration: { type: "Identifier", name: "_ArdoWrapped" },
    })
  }
}
