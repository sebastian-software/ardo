/**
 * Recma plugin that wraps the MDX default export with ArdoPageDataProvider.
 *
 * Instead of manipulating the ESTree AST (which is complex and fragile),
 * this plugin operates on the stringified output via the `toJs` hook.
 * It finds `export default function MDXContent` and wraps it.
 */

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

export function recmaWrapExport() {
  return (tree: EstreeProgram) => {
    // Find the export default declaration index
    let defaultIdx = -1
    let fnName = ""

    for (let i = 0; i < tree.body.length; i++) {
      const node = tree.body[i]
      if (
        node.type === "ExportDefaultDeclaration" &&
        node.declaration?.type === "FunctionDeclaration" &&
        node.declaration.id?.name
      ) {
        defaultIdx = i
        fnName = node.declaration.id.name
        break
      }
    }

    if (defaultIdx === -1) return

    // Remove the `export default` - keep only the function declaration
    const exportNode = tree.body[defaultIdx]
    tree.body[defaultIdx] = exportNode.declaration as EstreeNode

    // Add import for ArdoPageDataProvider + jsx runtime
    const importDP: EstreeNode = {
      type: "ImportDeclaration",
      specifiers: [
        {
          type: "ImportSpecifier",
          imported: { type: "Identifier", name: "ArdoPageDataProvider" },
          local: { type: "Identifier", name: "_ArdoPageDP" },
        },
      ],
      source: { type: "Literal", value: "ardo/runtime" },
    }

    const importJsx: EstreeNode = {
      type: "ImportDeclaration",
      specifiers: [
        {
          type: "ImportSpecifier",
          imported: { type: "Identifier", name: "jsx" },
          local: { type: "Identifier", name: "_ardoJsx" },
        },
      ],
      source: { type: "Literal", value: "react/jsx-runtime" },
    }

    // Wrapper function: _ArdoWrapped(props) => jsx(_ArdoPageDP, { frontmatter, toc, children: jsx(fnName, props) })
    const wrapperFn: EstreeNode = {
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
                    {
                      type: "Property",
                      key: { type: "Identifier", name: "frontmatter" },
                      value: { type: "Identifier", name: "frontmatter" },
                      kind: "init",
                      shorthand: true,
                      computed: false,
                      method: false,
                    },
                    {
                      type: "Property",
                      key: { type: "Identifier", name: "toc" },
                      value: { type: "Identifier", name: "toc" },
                      kind: "init",
                      shorthand: true,
                      computed: false,
                      method: false,
                    },
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

    const newExport: EstreeNode = {
      type: "ExportDefaultDeclaration",
      declaration: { type: "Identifier", name: "_ArdoWrapped" },
    }

    tree.body.unshift(importDP, importJsx)
    tree.body.push(wrapperFn, newExport)
  }
}
