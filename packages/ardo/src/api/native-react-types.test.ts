import { createRequire } from "node:module"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { NativeApiProject } from "./index"

let temporary: string
let project: NativeApiProject | undefined
beforeEach(async () => {
  temporary = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-native-react-types-"))
})
afterEach(async () => {
  await project?.close()
  project = undefined
  await fs.rm(temporary, { recursive: true, force: true })
})

describe("native API extraction with installed React types", () => {
  it("expands named and qualified namespace attributes while retaining generics and overrides", async () => {
    const reactTypes = path.join(
      path.dirname(createRequire(import.meta.url).resolve("@types/react/package.json")),
      "index.d.ts"
    )
    const tsconfig = path.join(temporary, "tsconfig.json")
    const entry = path.join(temporary, "index.ts")
    await fs.writeFile(
      tsconfig,
      JSON.stringify({
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "Bundler",
          lib: ["ES2022", "DOM"],
          strict: true,
          skipLibCheck: true,
          noEmit: true,
          types: [],
          paths: { react: [reactTypes] },
        },
        files: [entry],
      })
    )
    await fs.writeFile(
      entry,
      `import type { AnchorHTMLAttributes, ReactNode } from "react";
import type * as React from "react";

export type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  /** Internal route destination. */
  to: string;
  /** Authored content overrides the inherited description. */
  children?: ReactNode;
  rel: "next" | "prev";
};

export interface QualifiedProps extends React.AnchorHTMLAttributes<HTMLButtonElement> {
  /** An application-owned property. */
  trackingId: string;
  rel: "next" | "prev";
}
`
    )
    project = new NativeApiProject({ tsconfig, entryPoints: [entry] })
    const result = await project.extract()
    expect(result.diagnostics).toStrictEqual([])
    const link = result.items.find((item) => item.name === "LinkProps")
    expect(link?.propertiesComplete).toBe(true)
    expect(link?.properties.map((property) => property.name)).toStrictEqual(
      expect.arrayContaining(["className", "target", "onClick", "aria-label", "to", "rel"])
    )
    expect(link?.properties.map((property) => property.name)).not.toContain("href")
    expect(link?.properties.find((property) => property.name === "rel")?.type).toBe(
      '(string | undefined) & ("next" | "prev")'
    )
    expect(link?.properties.find((property) => property.name === "onClick")?.type).toContain(
      "HTMLAnchorElement"
    )
    expect(link?.properties.find((property) => property.name === "children")).toMatchObject({
      optional: true,
      comment: { description: "Authored content overrides the inherited description." },
    })
    const qualified = result.items.find((item) => item.name === "QualifiedProps")
    expect(qualified?.propertiesComplete).toBe(true)
    expect(qualified?.properties.map((property) => property.name)).toStrictEqual(
      expect.arrayContaining(["className", "href", "aria-label", "trackingId"])
    )
    expect(qualified?.properties.find((property) => property.name === "onClick")?.type).toContain(
      "HTMLButtonElement"
    )
    expect(qualified?.properties.find((property) => property.name === "rel")?.type).toBe(
      '"next" | "prev"'
    )
  })
})
