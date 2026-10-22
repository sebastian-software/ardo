// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ArdoSiteConfigProvider } from "../../runtime/hooks"
import { resolveArdoLabels } from "../labels"
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

  it("offers localized, selected source after a denied copy and allows retrying", async () => {
    const user = userEvent.setup()
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockRejectedValueOnce(new DOMException("Denied", "NotAllowedError"))
      .mockResolvedValueOnce()
    const code = "original source\n  keeps its spacing\n"
    render(
      <ArdoSiteConfigProvider
        value={{
          labels: resolveArdoLabels({
            copyButton: {
              copyFailed: "Could not copy. Copy the selected text below.",
              manualCode: "Source for manual copying",
            },
          }),
        }}
      >
        <ArdoCodeBlock code={code}>
          <pre>different highlighted representation</pre>
        </ArdoCodeBlock>
      </ArdoSiteConfigProvider>
    )
    const status = screen.getByRole("status")
    expect(status.textContent).toBe("")
    await user.click(screen.getByRole("button", { name: "Copy code" }))
    const field = await screen.findByRole<HTMLTextAreaElement>("textbox", {
      name: "Source for manual copying",
    })
    expect(status.textContent).toBe("Could not copy. Copy the selected text below.")
    expect(field.getAttribute("aria-describedby")).toBe(status.id)
    expect(field.readOnly).toBe(true)
    expect(document.activeElement).toBe(field)
    expect(field.value).toBe(code)
    expect(field.value.slice(field.selectionStart, field.selectionEnd)).toBe(code)
    await user.click(screen.getByRole("button", { name: "Copy code" }))
    expect(writeText).toHaveBeenLastCalledWith(code)
    expect(screen.queryByRole("textbox")).toBeNull()
    expect(status.textContent).toBe("Copied!")
    expect(screen.getByRole("button", { name: "Copied!" })).toBeTruthy()
  })

  it("keeps outdenting authored template strings", async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue()
    render(<ArdoCodeBlock>{"\n    first\n      second\n"}</ArdoCodeBlock>)
    await user.click(screen.getByRole("button", { name: "Copy code" }))
    expect(writeText).toHaveBeenCalledWith("first\n  second")
  })
})
