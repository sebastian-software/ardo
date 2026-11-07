import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ArdoProvider, ArdoSiteConfigProvider } from "../runtime/hooks"
import { ArdoFooter } from "./Footer"
import { resolveArdoLabels } from "./labels"

function renderFooter(
  node: React.ReactNode,
  options: {
    lang?: string
    labels?: NonNullable<Parameters<typeof resolveArdoLabels>[0]>
    config?: { buildTime?: string; buildHash?: string }
  } = {}
): string {
  const labels = options.labels === undefined ? undefined : resolveArdoLabels(options.labels)
  const content = (
    <ArdoProvider config={{ title: "Docs", lang: options.lang, ...options.config }} sidebar={[]}>
      {node}
    </ArdoProvider>
  )
  const wrapped =
    labels === undefined ? (
      content
    ) : (
      <ArdoSiteConfigProvider value={{ labels }}>{content}</ArdoSiteConfigProvider>
    )
  return renderToStaticMarkup(wrapped)
}

/** The footer's "Built on …" line; asserting it first keeps reference checks from passing vacuously. */
function buildLine(view: string): string {
  const [line] = /<p[^>]*>Built on[^<]*<\/p>/.exec(view) ?? []
  expect(line).toBeDefined()
  return line as string
}

describe("ArdoFooter", () => {
  it("names the site by its title rather than the docs package name", () => {
    const view = renderToStaticMarkup(
      <ArdoProvider config={{ title: "Acme Docs", project: { name: "acme-docs" } }} sidebar={[]}>
        <ArdoFooter ardoLink={false} />
      </ArdoProvider>
    )

    expect(view).toContain("Acme Docs")
    expect(view).not.toContain("acme-docs")
  })

  it("escapes plain string footer content", () => {
    const view = renderFooter(
      <ArdoFooter
        ardoLink={false}
        message="<strong>Released</strong>"
        copyright="<script>alert('x')</script>"
      />
    )

    expect(view).toContain("&lt;strong&gt;Released&lt;/strong&gt;")
    expect(view).toContain("&lt;script&gt;alert(&#x27;x&#x27;)&lt;/script&gt;")
    expect(view).not.toContain("<strong>Released</strong>")
    expect(view).not.toContain("<script>")
  })

  it("renders trusted HTML only through explicit trusted props", () => {
    const view = renderFooter(
      <ArdoFooter
        ardoLink={false}
        trustedMessageHtml="<strong>Released</strong>"
        trustedCopyrightHtml="Copyright <em>2026</em>"
      />
    )

    expect(view).toContain("<strong>Released</strong>")
    expect(view).toContain("Copyright <em>2026</em>")
  })

  it("formats build dates with the site locale and keeps invalid dates readable", () => {
    const date = "2026-01-05T00:30:00.000Z"
    const expected = new Date(date).toLocaleDateString("de-DE", {
      timeZone: "UTC",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    const view = renderFooter(<ArdoFooter ardoLink={false} buildTime={date} />, {
      lang: "de-DE",
    })
    const utils = renderFooter(<ArdoFooter ardoLink={false} buildTime="not-a-date" />, {
      lang: "de-DE",
    })

    expect(view).toContain(`Built on ${expected}`)
    expect(utils).toContain("Built on not-a-date")
  })

  it("uses configured footer labels", () => {
    const view = renderFooter(<ArdoFooter buildTime="2026-01-05T12:00:00.000Z" />, {
      labels: {
        footer: {
          builtOn: "Erstellt am",
          builtWithArdo: "Erstellt mit Ardo",
        },
      },
    })

    expect(view).toContain("Erstellt am")
    expect(view).toContain("Erstellt mit Ardo")
  })

  describe("build reference", () => {
    const buildTime = "2026-01-05T12:00:00.000Z"

    it("shows a configured buildHash after the build date", () => {
      const view = renderFooter(<ArdoFooter ardoLink={false} />, {
        config: { buildTime, buildHash: "x" },
      })

      expect(buildLine(view)).toContain("(x)")
    })

    it("omits the reference when the configured buildHash is empty", () => {
      const view = renderFooter(<ArdoFooter ardoLink={false} />, {
        config: { buildTime, buildHash: "" },
      })

      expect(buildLine(view)).not.toContain("(")
    })

    it("prefers the buildHash prop over the configured one", () => {
      const view = renderFooter(<ArdoFooter ardoLink={false} buildHash="prop-ref" />, {
        config: { buildTime, buildHash: "config-ref" },
      })
      const line = buildLine(view)

      expect(line).toContain("(prop-ref)")
      expect(line).not.toContain("config-ref")
    })
  })
})
