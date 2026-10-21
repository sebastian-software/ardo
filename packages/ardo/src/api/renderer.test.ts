import { describe, expect, it } from "vitest"

import type { ApiDeclaration, ApiSignature } from "./types"

import { renderDeclarationDocs } from "./renderer"

const noComment = { description: "", tags: [] }

function signature(description = ""): ApiSignature {
  return {
    text: "(config: Config) => Config",
    parameters: [{ name: "config", type: "Config", optional: false, rest: false, description }],
    returnType: "Config",
    comment: noComment,
  }
}

function render(item: Partial<ApiDeclaration>): string {
  const declaration: ApiDeclaration = {
    name: "defineConfig",
    kind: "function",
    signature: "function defineConfig(config: Config): Config",
    comment: noComment,
    signatures: [signature()],
    properties: [],
    propertiesComplete: true,
    source: { file: "src/index.ts", line: 1 },
    ...item,
  }
  const page = renderDeclarationDocs([declaration], "api-reference", "API").find(
    (entry) => entry.path !== "index.md"
  )
  return page?.content ?? ""
}

describe("renderDeclarationDocs", () => {
  it("puts the sections of a single function signature directly under the title", () => {
    const page = render({
      comment: { description: "Defines a config.", tags: [{ name: "example", text: "x()" }] },
    })

    expect(page).toContain("\n## Example\n")
    expect(page).toContain("\n## Parameters\n")
    expect(page).toContain("\n## Returns\n")
    expect(page).not.toContain("###")
  })

  it("nests the sections of overloads under their own heading", () => {
    const page = render({ signatures: [signature(), signature()] })

    expect(page).toContain("## Overload")
    expect(page).toContain("\n### Parameters\n")
  })

  it("leaves out the description column when no parameter has one", () => {
    expect(render({})).toContain("| Name | Type | Required |\n| --- | --- | --- |\n")
    expect(render({ signatures: [signature("The site config.")] })).toContain(
      "| Name | Type | Required | Description |"
    )
  })
})
