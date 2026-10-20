// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ArdoCodeBlock } from "./CodeBlock"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("code block copying", () => {
  it("copies native highlighted React content with its original spacing", async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue()
    render(
      <ArdoCodeBlock language="rust">
        <pre>
          <code>
            <span className="line" data-ln="1">
              <span>fn</span>
              {" main() {\n"}
            </span>
            <span className="line" data-ln="2">
              {'    println!("Hello");\n'}
            </span>
            <span className="line" data-ln="3">
              {"}\n"}
            </span>
          </code>
        </pre>
      </ArdoCodeBlock>
    )
    await user.click(screen.getByRole("button", { name: "Copy code" }))
    expect(writeText).toHaveBeenCalledWith('fn main() {\n    println!("Hello");\n}\n')
  })

  it("preserves explicit source when the highlighted view differs", async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue()
    render(
      <ArdoCodeBlock code="original source">
        <pre>displayed representation</pre>
      </ArdoCodeBlock>
    )
    await user.click(screen.getByRole("button", { name: "Copy code" }))
    expect(writeText).toHaveBeenCalledWith("original source")
  })

  it("keeps outdenting authored template strings", async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue()
    render(<ArdoCodeBlock>{"\n    first\n      second\n"}</ArdoCodeBlock>)
    await user.click(screen.getByRole("button", { name: "Copy code" }))
    expect(writeText).toHaveBeenCalledWith("first\n  second")
  })
})
