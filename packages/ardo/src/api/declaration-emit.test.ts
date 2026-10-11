import { execFileSync } from "node:child_process"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { generateDeclarationDocs } from "./index"

let temporary: string
const compiler =
  process.env.ARDO_DECLARATION_TSC ??
  fileURLToPath(new URL("../../../../node_modules/typescript/bin/tsc", import.meta.url))

beforeEach(async () => {
  temporary = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-api-emit-"))
  await fs.writeFile(
    path.join(temporary, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        target: "ES2022",
        module: "ESNext",
        lib: ["ES2022"],
        types: [],
        declaration: true,
        declarationMap: true,
        emitDeclarationOnly: true,
        noEmitOnError: true,
        removeComments: false,
        outDir: "declarations",
      },
      files: ["api.ts"],
    })
  )
})

afterEach(async () => {
  await fs.rm(temporary, { recursive: true, force: true })
})

describe("compiler declaration emit to documentation", () => {
  it("extracts inferred signatures and retained JSDoc from freshly compiled source", async () => {
    await fs.writeFile(
      path.join(temporary, "api.ts"),
      [
        "/** Creates a user.",
        " * @param name - User's display name.",
        " * @returns The created user.",
        " */",
        "export function createUser(name = 'guest') { return { name, id: 1, active: true }; }",
        "export const createAgain = createUser;",
        "export async function loadUser() { return createUser(); }",
        "interface Base<T> {",
        "  /** Display label. */",
        "  label: T;",
        "}",
        "/** Widget options. */",
        "export interface Options extends Base<string> {",
        "  /** Optional size. @defaultValue 2 */",
        "  size?: number;",
        "}",
        "/** Displays the widget. */",
        "export function Widget(props: Options) { return props.label; }",
        "export function choose(value: string): string;",
        "export function choose(value: number): number;",
        "export function choose(value: string | number) { return value; }",
        "/** @internal */ export function internalOnly() { return 1; }",
      ].join("\n")
    )
    execFileSync(compiler, ["--project", path.join(temporary, "tsconfig.json")], {
      cwd: temporary,
      encoding: "utf8",
      timeout: 15_000,
    })
    const result = await generateDeclarationDocs(
      { entryPoints: [path.join(temporary, "declarations/api.d.ts")] },
      path.join(temporary, "routes")
    )
    expect(result.diagnostics).toStrictEqual([])
    const factory = result.items.find((item) => item.name === "createUser")
    expect(factory?.comment.description).toBe("Creates a user.")
    expect(factory?.signatures[0].parameters).toMatchObject([
      { name: "name", type: "string", optional: true, description: "User's display name." },
    ])
    expect(factory?.signatures[0].returnType).toContain("id: number")
    expect(factory?.signatures[0].returnType).toContain("active: boolean")
    expect(result.items.find((item) => item.name === "createAgain")?.signatures[0].returnType).toBe(
      factory?.signatures[0].returnType
    )
    expect(
      result.items.find((item) => item.name === "loadUser")?.signatures[0].returnType
    ).toContain("Promise<")
    expect(result.items.find((item) => item.name === "Widget")).toMatchObject({
      propertiesComplete: true,
      properties: [
        { name: "label", type: "string", comment: { description: "Display label." } },
        { name: "size", optional: true, comment: { description: "Optional size." } },
      ],
    })
    expect(result.items.find((item) => item.name === "choose")?.signatures).toHaveLength(2)
    expect(result.items.some((item) => item.name === "internalOnly")).toBe(false)
    expect(result.pages.find((page) => page.path === "functions/createuser.md")?.content).toContain(
      "The created user."
    )
    expect(result.pages.find((page) => page.path === "interfaces/options.md")?.content).toContain(
      "Default:"
    )
  }, 20_000)
})
