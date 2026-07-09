import { describe, expect, it } from "vitest"

import { resolveConfig } from "../config"
import { buildPublicPath, createCurrentRouteIdentity, createRouteIdentity } from "./route-identity"

describe("route identity", () => {
  it("normalizes route paths separately from public paths", () => {
    expect(
      createRouteIdentity({
        basePath: "/v3/",
        routePath: "guide/getting-started/",
        versionId: "v3",
      })
    ).toStrictEqual({
      publicPath: "/v3/guide/getting-started",
      routePath: "/guide/getting-started",
      versionId: "v3",
    })
  })

  it("keeps the deployment root stable for root routes", () => {
    expect(buildPublicPath({ basePath: "/", routePath: "/" })).toBe("/")
    expect(buildPublicPath({ basePath: "/docs/", routePath: "/" })).toBe("/docs/")
    expect(buildPublicPath({ basePath: "/docs/v3/", routePath: "/" })).toBe("/docs/v3/")
  })

  it("builds version-only public paths", () => {
    expect(buildPublicPath({ basePath: "/v3/", routePath: "/guide/getting-started" })).toBe(
      "/v3/guide/getting-started"
    )
    expect(buildPublicPath({ basePath: "/docs/v3/", routePath: "/guide/getting-started" })).toBe(
      "/docs/v3/guide/getting-started"
    )
  })

  it("builds future version-plus-locale public paths", () => {
    expect(
      buildPublicPath({
        basePath: "/v3/",
        localeId: "en",
        routePath: "/guide/getting-started",
      })
    ).toBe("/v3/en/guide/getting-started")

    expect(buildPublicPath({ basePath: "/v3/", localeId: "en", routePath: "/" })).toBe("/v3/en/")
  })

  it("normalizes duplicate slashes, whitespace, and backslashes", () => {
    expect(
      buildPublicPath({
        basePath: " /docs//v3/ ",
        localeId: " /de/ ",
        routePath: "\\guide\\\\configuration\\",
      })
    ).toBe("/docs/v3/de/guide/configuration")
  })

  it("creates current route identities from resolved config", () => {
    const config = resolveConfig(
      {
        title: "Docs",
        base: "/docs/",
        versioning: {
          current: "v3",
          versions: [{ id: "v3", path: "/v3/" }],
        },
      },
      "/site"
    )

    expect(createCurrentRouteIdentity("/guide", config)).toStrictEqual({
      publicPath: "/docs/v3/guide",
      routePath: "/guide",
      versionId: "v3",
    })
  })

  it("uses the default locale in current route identities when i18n is active", () => {
    const config = resolveConfig(
      {
        title: "Docs",
        base: "/docs/",
        versioning: {
          current: "v3",
          versions: [{ id: "v3", path: "/v3/" }],
        },
        i18n: {
          defaultLocale: "en",
          locales: [{ id: "en" }, { id: "de" }],
        },
      },
      "/site"
    )

    expect(createCurrentRouteIdentity("/guide", config)).toStrictEqual({
      localeId: "en",
      publicPath: "/docs/v3/en/guide",
      routePath: "/guide",
      versionId: "v3",
    })
  })

  it("keeps locale optional for current non-i18n sites", () => {
    const config = resolveConfig({ title: "Docs", base: "/docs/" }, "/site")

    expect(createCurrentRouteIdentity("/", config)).toStrictEqual({
      publicPath: "/docs/",
      routePath: "/",
    })
    expect(createCurrentRouteIdentity("/guide", config, { localeId: "en" })).toStrictEqual({
      localeId: "en",
      publicPath: "/docs/en/guide",
      routePath: "/guide",
    })
  })
})
