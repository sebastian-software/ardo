import { describe, expect, it } from "vitest"

import { resolveConfig } from "./index"

describe("resolveConfig", () => {
  it("rejects removed TypeDoc configuration supplied through a config file", () => {
    const legacy = { title: "Test", typedoc: true }
    expect(() => resolveConfig(legacy, "/project")).toThrow("The typedoc option was removed")
  })
  it("resolves config with defaults", () => {
    const config = {
      title: "Test",
    }

    const resolved = resolveConfig(config, "/project")

    expect(resolved.title).toBe("Test")
    expect(resolved.description).toBe("")
    expect(resolved.base).toBe("/")
    expect(resolved.srcDir).toBe("content")
    expect(resolved.outDir).toBe("build")
    expect(resolved.lang).toBe("en")
    expect(resolved.contentDir).toBe("/project/content")
    expect(resolved.sidebar).toStrictEqual({})
    expect(resolved.validation).toStrictEqual({})
  })

  it("uses provided values over defaults", () => {
    const config = {
      title: "Custom",
      description: "Custom description",
      base: "/custom/",
      srcDir: "docs",
      outDir: "release/docs",
      lang: "de",
    }

    const resolved = resolveConfig(config, "/project")

    expect(resolved.title).toBe("Custom")
    expect(resolved.description).toBe("Custom description")
    expect(resolved.base).toBe("/custom/")
    expect(resolved.srcDir).toBe("docs")
    expect(resolved.outDir).toBe("release/docs")
    expect(resolved.lang).toBe("de")
    expect(resolved.contentDir).toBe("/project/docs")
  })

  it("preserves generated sidebar config", () => {
    const config = {
      title: "Test",
      sidebar: {
        sectionOrder: ["guide", "reference"],
      },
    }

    const resolved = resolveConfig(config, "/project")

    expect(resolved.sidebar).toStrictEqual({
      sectionOrder: ["guide", "reference"],
    })
  })

  it("preserves a frontmatter validation policy", () => {
    const resolved = resolveConfig(
      {
        title: "Test",
        validation: {
          frontmatter: { invalid: "error", unknown: "warn" },
        },
      },
      "/project"
    )

    expect(resolved.validation).toStrictEqual({
      frontmatter: { invalid: "error", unknown: "warn" },
    })
  })

  it("preserves lint severities and rejects unknown rules or levels", () => {
    expect(
      resolveConfig(
        {
          title: "Test",
          validation: { lint: { "heading-skip": "error", "shell-prompt": "ignore" } },
        },
        "/project"
      ).validation
    ).toStrictEqual({ lint: { "heading-skip": "error", "shell-prompt": "ignore" } })

    expect(() =>
      resolveConfig(
        // @ts-expect-error Invalid runtime input exercises configuration validation.
        { title: "Test", validation: { lint: { "heading-tree": "warn" } } },
        "/project"
      )
    ).toThrow('validation.lint has unknown rule "heading-tree"')
    expect(() =>
      resolveConfig(
        // @ts-expect-error Invalid runtime input exercises configuration validation.
        { title: "Test", validation: { lint: { "multiple-h1": "info" } } },
        "/project"
      )
    ).toThrow('validation.lint.multiple-h1 must be "error", "warn", or "ignore".')
  })

  it("resolves major versioning paths against the deployment base", () => {
    const resolved = resolveConfig(
      {
        title: "Test",
        base: "/repo/",
        versioning: {
          current: "v3",
          versions: [
            { id: "v3", label: "3.x", path: "/v3/" },
            { id: "v2", label: "2.x", path: "/v2/" },
          ],
        },
      },
      "/project"
    )

    expect(resolved.base).toBe("/repo/v3/")
    expect(resolved.versioning).toStrictEqual({
      current: "v3",
      rootRedirect: true,
      versions: [
        { id: "v3", label: "3.x", path: "/repo/v3/" },
        { id: "v2", label: "2.x", path: "/repo/v2/" },
      ],
    })
  })

  it("resolves i18n URL preparation config", () => {
    const resolved = resolveConfig(
      {
        title: "Test",
        i18n: {
          defaultLocale: "en",
          locales: [{ id: "en" }, { id: "de", label: "Deutsch" }],
        },
      },
      "/project"
    )

    expect(resolved.i18n).toStrictEqual({
      defaultLocale: "en",
      locales: [
        { id: "en", label: "en" },
        { id: "de", label: "Deutsch" },
      ],
    })
  })

  it("merges markdown config with defaults", () => {
    const config = {
      title: "Test",
      markdown: {
        lineNumbers: true,
      },
    }

    const resolved = resolveConfig(config, "/project")

    expect(resolved.markdown.lineNumbers).toBe(true)
    expect(resolved.markdown.theme).toStrictEqual({
      light: "github-light-default",
      dark: "github-dark-default",
    })
    expect(resolved.markdown.anchor).toBe(true)
  })

  it("handles head config", () => {
    const config = {
      title: "Test",
      head: [{ tag: "meta", attrs: { name: "author", content: "Test Author" } }],
    }

    const resolved = resolveConfig(config, "/project")

    expect(resolved.head).toHaveLength(1)
    expect(resolved.head[0]).toStrictEqual({
      tag: "meta",
      attrs: { name: "author", content: "Test Author" },
    })
  })

  it("rejects base paths without leading and trailing slashes", () => {
    expect(() => resolveConfig({ title: "Test", base: "docs" }, "/project")).toThrow(
      "base must start and end"
    )

    expect(() => resolveConfig({ title: "Test", base: "/docs" }, "/project")).toThrow(
      "base must start and end"
    )
  })

  it("rejects invalid site URLs", () => {
    expect(() => resolveConfig({ title: "Test", siteUrl: "not a url" }, "/project")).toThrow(
      "siteUrl must be an absolute URL"
    )
  })

  it.each(["/kit", ["kit"], ["/kit?preview"], ["/kit#section"], [12]])(
    "rejects invalid sitemap exclusion prefixes: %j",
    (exclude) => {
      expect(() =>
        resolveConfig(
          {
            title: "Test",
            seo: {
              sitemap: {
                // @ts-expect-error Invalid runtime input exercises configuration validation.
                exclude,
              },
            },
          },
          "/project"
        )
      ).toThrow("seo.sitemap.exclude")
    }
  )

  it("rejects sitemap priorities outside the sitemap range", () => {
    expect(() =>
      resolveConfig({ title: "Test", seo: { sitemap: { priority: 2 } } }, "/project")
    ).toThrow("seo.sitemap.priority must be between 0 and 1")
  })

  it("rejects invalid versioning config", () => {
    expect(() =>
      resolveConfig(
        {
          title: "Test",
          versioning: {
            current: "v4",
            versions: [{ id: "v3", path: "/v3/" }],
          },
        },
        "/project"
      )
    ).toThrow('versioning.current "v4" must match a version id')

    expect(() =>
      resolveConfig(
        {
          title: "Test",
          versioning: {
            current: "v3",
            versions: [{ id: "v3", path: "v3" }],
          },
        },
        "/project"
      )
    ).toThrow('versioning.versions["v3"].path must start and end with "/"')
  })

  it("rejects invalid i18n config", () => {
    expect(() =>
      resolveConfig(
        {
          title: "Test",
          i18n: {
            defaultLocale: "fr",
            locales: [{ id: "en" }],
          },
        },
        "/project"
      )
    ).toThrow('i18n.defaultLocale "fr" must match a locale id')

    expect(() =>
      resolveConfig(
        {
          title: "Test",
          i18n: {
            defaultLocale: "en",
            locales: [{ id: "en/us" }],
          },
        },
        "/project"
      )
    ).toThrow("i18n.locales entries must be a non-empty locale id without slashes")
  })

  it("rejects remote OpenAPI specs and unsafe output paths", () => {
    expect(() =>
      resolveConfig(
        {
          openapi: { out: "../api", spec: "https://example.com/openapi.yaml" },
          title: "Docs",
        },
        "/project"
      )
    ).toThrow("openapi.spec must be a local file path")
  })

  it("resolves a configured buildTime to its canonical UTC form", () => {
    expect(
      resolveConfig({ title: "Test", buildTime: "2026-12-01T00:00:00+01:00" }, "/project").buildTime
    ).toBe("2026-11-30T23:00:00.000Z")
    expect(
      resolveConfig({ title: "Test", buildTime: "2026-10-15T00:00:00Z" }, "/project").buildTime
    ).toBe("2026-10-15T00:00:00.000Z")
  })

  it("leaves buildTime absent when it is not configured", () => {
    const resolved = resolveConfig({ title: "Test" }, "/project")
    expect(resolved.buildTime).toBeUndefined()
    expect("buildTime" in resolved).toBe(false)
  })

  it("keeps a configured buildHash as the pinned commit reference", () => {
    expect(resolveConfig({ title: "Test", buildHash: "abc1234" }, "/project").buildHash).toBe(
      "abc1234"
    )
  })

  it("keeps an empty buildHash so that it can switch the reference off", () => {
    const resolved = resolveConfig({ title: "Test", buildHash: "" }, "/project")
    expect(resolved.buildHash).toBe("")
    expect("buildHash" in resolved).toBe(true)
  })

  it("leaves buildHash absent when it is not configured", () => {
    const resolved = resolveConfig({ title: "Test" }, "/project")
    expect(resolved.buildHash).toBeUndefined()
    expect("buildHash" in resolved).toBe(false)
  })

  it.each([
    ["number", 123],
    ["null", null],
  ])("rejects a non-string buildHash (%s) in the aggregated error", (_name, buildHash) => {
    expect(() =>
      resolveConfig({ title: "Test", buildHash: buildHash as never }, "/project")
    ).toThrow("- buildHash must be a string.")
  })

  it.each([
    ["no zone", "2026-12-01T00:00:00"],
    ["date only", "2026-12-01"],
    ["impossible date", "2026-02-30T00:00:00Z"],
    ["non-string", new Date("2026-12-01T00:00:00Z")],
  ])("rejects an invalid buildTime (%s) in the aggregated error", (_name, buildTime) => {
    expect(() =>
      // @ts-expect-error JavaScript configs can pass values outside the option type.
      resolveConfig({ title: "Test", buildTime }, "/project")
    ).toThrow("- buildTime must")
  })
})
