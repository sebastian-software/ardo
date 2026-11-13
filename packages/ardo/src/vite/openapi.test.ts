import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { compileMdxRouteModule } from "./mdx-compile"
import { generateOpenApiDocs } from "./openapi"

let root: string

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-openapi-"))
  await fs.mkdir(path.join(root, "app", "routes"), { recursive: true })
})

afterEach(async () => {
  vi.restoreAllMocks()
  await fs.rm(root, { force: true, recursive: true })
})

async function generate(spec: object): Promise<number> {
  await fs.writeFile(path.join(root, "openapi.json"), JSON.stringify(spec))
  return generateOpenApiDocs({
    config: { spec: "openapi.json" },
    root,
    routesDir: path.join(root, "app", "routes"),
  })
}

async function readPage(page: string): Promise<string> {
  return fs.readFile(path.join(root, "app", "routes", "api", page), "utf8")
}

function compilePage(source: string): string {
  return compileMdxRouteModule({
    format: "mdx",
    id: "page.mdx",
    markdownConfig: undefined,
    source,
  }).code
}

describe("generateOpenApiDocs", () => {
  it("generates static reference routes from a local YAML spec", async () => {
    await fs.writeFile(
      path.join(root, "openapi.yaml"),
      "openapi: 3.1.0\ninfo:\n  title: Pets\npaths:\n  /pets:\n    get:\n      tags: [Pets]\n      summary: List pets\n      responses:\n        '200':\n          description: OK\n"
    )
    await expect(
      generateOpenApiDocs({
        config: { spec: "openapi.yaml" },
        root,
        routesDir: path.join(root, "app", "routes"),
      })
    ).resolves.toBe(2)
    await expect(
      fs.readFile(path.join(root, "app", "routes", "api", "pets", "get-pets.mdx"), "utf8")
    ).resolves.toContain("# GET /pets")
    const operation = await fs.readFile(path.join(root, "app/routes/api/pets/get-pets.mdx"), "utf8")
    expect(operation).toContain("contentWidth: page")
    expect(operation).toContain("editLink: false")
    expect(operation).toContain("lastUpdated: false")
  })

  it("renders spec text with MDX syntax literally", async () => {
    await generate({
      info: { description: 'Accepts {"a": 1} and <b>tags</b>.', title: "Pets <v1> {beta}" },
      openapi: "3.1.0",
      paths: {
        "/pets/{petId}": {
          get: {
            description: "unused",
            parameters: [{ description: "Id like {id} < 10", in: "path", name: "petId" }],
            responses: { "200": { description: "A Map<string, Pet>" } },
            summary: "returns List<Pet>",
            tags: ["Pets"],
          },
        },
      },
    })

    const index = compilePage(await readPage("index.mdx"))
    expect(index).toContain('"title":"Pets <v1> {beta}"')
    expect(index).toContain('{"Accepts "}{"{"}{"\\"a\\": 1"}{"}"}{" and "}{"<"}{"b>tags"}')

    const operation = compilePage(await readPage("pets/get-pets-petid.mdx"))
    expect(operation).toContain('"title":"GET /pets/{petId}"')
    // Outside the frontmatter string, `{petId}` would be a JSX expression.
    expect(operation).not.toMatch(/\{petId\}(?!")/u)
    expect(operation).toContain('{"returns List"}{"<"}{"Pet>"}')
    expect(operation).toContain('{": A Map"}{"<"}{"string, Pet>"}')
    expect(operation).toContain('{" (path): Id like "}{"{"}{"id"}{"}"}{" "}{"<"}{" 10"}')
  })

  it("keeps Markdown formatting and code in spec descriptions", async () => {
    await generate({
      openapi: "3.0.3",
      paths: {
        "/pets": {
          get: {
            summary:
              'Returns `List<Pet>` as **JSON**, escaped \\{ and \\\\{x}.\n\n```json\n{"a": <b>}\n```',
          },
        },
      },
    })

    const operation = compilePage(await readPage("endpoints/get-pets.mdx"))
    expect(operation).toContain('<_components.code>{"List<Pet>"}</_components.code>')
    expect(operation).toContain('<_components.strong>{"JSON"}</_components.strong>')
    expect(operation).toContain('{"\\\\"}{"{"}{"x"}{"}"}')
    expect(operation).toContain('code={"{\\"a\\": <b>}\\n"}')
  })

  it("keeps code byte-identical in blockquotes, lists, and tilde fences", async () => {
    const quoted = '> Example:\n>\n> ~~~json\n> {"id": "<id>"}\n> ~~~'
    const listed = '- Request:\n\n  ```json title="body"\n  {"name": "{name}"}\n  ```'
    const tilde = '~~~~ json {"a": 1}\n<Pet>{x}\n~~~ not a close {y}\n~~~~'
    const inline = "```a{b}``` stays code, {c} does not"
    await generate({
      openapi: "3.1.0",
      paths: {
        "/pets": {
          post: {
            parameters: [{ description: listed, in: "query", name: "filter" }],
            responses: { "200": { description: `Example:\n\n${tilde}` } },
            summary: `${quoted}\n\n${inline}`,
          },
        },
      },
    })

    const source = await readPage("endpoints/post-pets.mdx")
    expect(source).toContain(quoted)
    expect(source).toContain('  {"name": "{name}"}\n')
    expect(source).toContain(tilde)
    expect(source).toContain("```a{b}``` stays code, \\{c\\} does not")
    const operation = compilePage(source)
    expect(operation).toContain('code={"{\\"id\\": \\"<id>\\"}\\n"}')
    expect(operation).toContain('code={"{\\"name\\": \\"{name}\\"}\\n"}')
    expect(operation).toContain('code={"<Pet>{x}\\n~~~ not a close {y}\\n"}')
    expect(operation).toContain('<_components.code>{"a{b}"}</_components.code>')
  })

  it("gives operations with colliding slugs their own pages", async () => {
    const pageCount = await generate({
      openapi: "3.1.0",
      paths: {
        "/pets/{petId}": { get: { summary: "By id" } },
        "/pets/petId": { get: { summary: "Literal" } },
        "/users": {
          get: { operationId: "get_user", summary: "Snake" },
          post: { operationId: "get.user", summary: "Dotted" },
          put: { operationId: "get-user-2", summary: "Taken suffix" },
        },
      },
    })

    expect(pageCount).toBe(6)
    const files = await fs.readdir(path.join(root, "app/routes/api/endpoints"))
    expect([...files].sort()).toStrictEqual([
      "get-pets-petid-2.mdx",
      "get-pets-petid.mdx",
      "get-user-2.mdx",
      "get-user-3.mdx",
      "get-user.mdx",
    ])
    await expect(readPage("endpoints/get-pets-petid.mdx")).resolves.toContain("By id")
    await expect(readPage("endpoints/get-pets-petid-2.mdx")).resolves.toContain("Literal")
    await expect(readPage("endpoints/get-user-3.mdx")).resolves.toContain("Dotted")
    const index = await readPage("index.mdx")
    expect(index).toContain("(./endpoints/get-pets-petid-2)")
    expect(index).toContain("(./endpoints/get-user-3)")
  })

  it("orders operations independently of the locale", async () => {
    vi.spyOn(String.prototype, "localeCompare").mockImplementation(() => {
      throw new Error("locale-dependent comparison")
    })
    await generate({
      openapi: "3.1.0",
      paths: {
        "/b": { get: { tags: ["a"] } },
        "/a": { get: { tags: ["a-b"] } },
      },
    })

    const index = await readPage("index.mdx")
    expect(index.indexOf("## a-b")).toBeLessThan(index.indexOf("## a\n"))
  })
})
