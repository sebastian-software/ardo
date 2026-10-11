// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { runInNewContext } from "node:vm"
import { isValidElement } from "react"
import * as jsxRuntime from "react/jsx-runtime"
import { transformWithOxc } from "vite"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ArdoCodeBlock } from "../ui/components/CodeBlock"
import { transformArdoCodeBlocks } from "./codeblock-transform"

afterEach(() => {
  cleanup()
})

describe("native code-block copy button", () => {
  it.each([
    [
      '<ArdoCodeBlock code={"const text = \\"<tag>\\"\\n\\n"} language="ts" />',
      'const text = "<tag>"\n\n',
    ],
    [
      '<ArdoCodeBlock language="text">{`\n  first\n\n  second\n`}</ArdoCodeBlock>',
      "first\n\nsecond",
    ],
    ['<ArdoCodeBlock code="\\n &lt;tag&gt;" language="text" />', "\\n <tag>"],
  ])("copies original text from transformed samples", async (source, expected) => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue()
    const transformed = await transformArdoCodeBlocks(source)
    const compiled = await transformWithOxc(`const render = () => (${transformed});`, "copy.tsx", {
      lang: "tsx",
      jsx: { runtime: "automatic" },
    })
    const element: unknown = runInNewContext(`${compiled.code}; render();`, {
      require: () => jsxRuntime,
      ArdoCodeBlock,
    })
    // eslint-disable-next-line vitest/no-conditional-in-test -- Validate the generated program result before rendering it.
    if (!isValidElement(element))
      throw new Error("Expected generated JSX to produce a React element")
    render(element)
    await user.click(screen.getByRole("button", { name: "Copy code" }))
    expect(writeText).toHaveBeenCalledWith(expected)
    expect(screen.getByRole("button", { name: "Copied!" })).toBeDefined()
    writeText.mockRestore()
  })
})
