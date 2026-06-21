import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { ArdoCard } from "./Card"
import { registerIcons } from "./Icon"

function CardTestIcon({ size = 20 }: { size?: number }) {
  return <svg data-testid="registered-card-icon" width={size} height={size} />
}

describe("ArdoCard", () => {
  it("renders static cards as non-interactive content", () => {
    const view = renderToStaticMarkup(
      <ArdoCard title="Static card">Use cards for highlighted content.</ArdoCard>
    )

    expect(view).toContain("<div")
    expect(view).toContain("<h3")
    expect(view).toContain("Static card")
    expect(view).not.toContain("<a")
  })

  it("renders external links with a safe target", () => {
    const view = renderToStaticMarkup(
      <ArdoCard title="External" href="https://example.com">
        Visit docs
      </ArdoCard>
    )

    expect(view).toContain('href="https://example.com"')
    expect(view).toContain('target="_blank"')
    expect(view).toContain('rel="noopener noreferrer"')
  })

  it("renders internal links through React Router", () => {
    const view = renderToStaticMarkup(
      <MemoryRouter>
        <ArdoCard title="Guide" href="/guide/getting-started">
          Read the guide
        </ArdoCard>
      </MemoryRouter>
    )

    expect(view).toContain('href="/guide/getting-started"')
  })

  it("renders registered icon names and custom icon nodes", () => {
    registerIcons({
      CardTestIcon,
    })

    const view = renderToStaticMarkup(<ArdoCard title="Registered" icon="CardTestIcon" />)
    const utils = renderToStaticMarkup(<ArdoCard title="Node" icon={<span>Icon</span>} />)

    expect(view).toContain('data-testid="registered-card-icon"')
    expect(view).toContain('aria-hidden="true"')
    expect(utils).toContain("<span>Icon</span>")
  })
})
