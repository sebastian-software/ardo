import { describe, expect, it } from "vitest"

import { defineConfig, resolveConfig } from "./index"

describe("defineConfig", () => {
  it("returns the config unchanged", () => {
    const config = {
      title: "Test Docs",
      description: "A test documentation site",
    }

    const result = defineConfig(config)

    expect(result).toStrictEqual(config)
  })

  it("preserves all config properties", () => {
    const config = {
      title: "My Docs",
      description: "Description",
      base: "/docs/",
      srcDir: "documentation",
    }

    const result = defineConfig(config)

    expect(result.title).toBe("My Docs")
    expect(result.base).toBe("/docs/")
    expect(result.srcDir).toBe("documentation")
  })
})

describe("resolveConfig", () => {
  it("resolves config with defaults", () => {
    const config = {
      title: "Test",
    }

    const resolved = resolveConfig(config, "/project")

    expect(resolved.title).toBe("Test")
    expect(resolved.description).toBe("")
    expect(resolved.base).toBe("/")
    expect(resolved.srcDir).toBe("content")
    expect(resolved.outDir).toBe("dist")
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
      outDir: "build",
      lang: "de",
    }

    const resolved = resolveConfig(config, "/project")

    expect(resolved.title).toBe("Custom")
    expect(resolved.description).toBe("Custom description")
    expect(resolved.base).toBe("/custom/")
    expect(resolved.srcDir).toBe("docs")
    expect(resolved.outDir).toBe("build")
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

  it("preserves brand configuration", () => {
    const resolved = resolveConfig(
      {
        title: "Test",
        brand: {
          color: "blue",
          accent: "teal",
          neutral: "slate",
          logo: "./app/assets/logo.svg",
        },
      },
      "/project"
    )

    expect(resolved.brand).toStrictEqual({
      color: "blue",
      accent: "teal",
      neutral: "slate",
      logo: "./app/assets/logo.svg",
    })
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

  it("rejects unknown brand hue presets", () => {
    expect(() =>
      resolveConfig(
        {
          title: "Test",
          // @ts-expect-error exercising runtime validation for JavaScript configs.
          brand: { color: "cerulean" },
        },
        "/project"
      )
    ).toThrow("brand.color must be one of")
  })
})
