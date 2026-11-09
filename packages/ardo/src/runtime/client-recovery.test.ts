// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest"
import { showClientRecovery } from "./client-recovery"

afterEach(() => {
  document.body.replaceChildren()
  document.documentElement.lang = "en"
})

function fixture() {
  const container = document.createElement("div")
  container.innerHTML = '<article><a href="/guide/">Static document</a></article>'
  document.body.append(container)
  return container
}

describe("independent client recovery", () => {
  it("retains the server DOM before hydration and focuses its native recovery heading", () => {
    const container = fixture()
    const article = container.querySelector("article")
    showClientRecovery({ container, preserveContent: true, homeHref: "/docs/" })
    expect(container.querySelector("article")).toBe(article)
    expect(container.querySelector('[role="alert"] h2')).toBe(document.activeElement)
    expect(container.querySelector("button")?.type).toBe("button")
    expect(container.querySelector('[role="alert"] a')?.getAttribute("href")).toMatch(/\/docs\/$/)
  })

  it("replaces failed chrome without rendering React or exposing an exception", () => {
    const container = fixture()
    showClientRecovery({
      container,
      preserveContent: false,
      homeHref: "/",
      customize: { title: "Our site", className: "brand" },
    })
    expect(container.querySelector("article")).toBeNull()
    expect(container.querySelector("main.brand h1")?.textContent).toBe("Our site")
    expect(container.textContent).not.toContain("Technical details")
    showClientRecovery({ container, preserveContent: false, homeHref: "/" })
    expect(container.querySelectorAll("[data-ardo-recovery]")).toHaveLength(1)
  })

  it("falls back to built-in German when customization or catalog getters throw", () => {
    document.documentElement.lang = "de-DE"
    const container = fixture()
    showClientRecovery({
      container,
      preserveContent: true,
      homeHref: "/de/",
      customize: {
        get title(): string {
          throw new Error("Private catalog error")
        },
      },
    })
    expect(container.querySelector("h2")?.textContent).toBe(
      "Diese Seite konnte nicht gestartet werden"
    )
    expect(container.querySelector("button")?.textContent).toBe("Seite neu laden")
    expect(container.querySelector("[role=alert]")?.getAttribute("lang")).toBe("de-DE")
    expect(container.textContent).not.toContain("Private")
  })

  it("uses an explicitly marked English fallback for an unsupported language", () => {
    document.documentElement.lang = "ja"
    const container = fixture()
    showClientRecovery({ container, preserveContent: false, homeHref: "/" })
    expect(document.documentElement.lang).toBe("ja")
    expect(container.querySelector("main")?.lang).toBe("en")
    expect(container.querySelector("button")?.textContent).toBe("Reload page")
  })

  it("does not turn invalid custom home destinations into script links", () => {
    const container = fixture()
    showClientRecovery({
      container,
      preserveContent: false,
      homeHref: "https://example.test/docs/",
      customize: { homeHref: "data:text/html,untrusted", reloadLabel: " " },
    })
    expect(container.querySelector("a")?.href).toBe("https://example.test/docs/")
    expect(container.querySelector("button")?.textContent).toBe("Reload page")
  })
})
