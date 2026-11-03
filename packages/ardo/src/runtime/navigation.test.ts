import { describe, expect, it } from "vitest"

import { resolveConfig } from "../config"
import { loadVirtualModule, RESOLVED_IDS, VIRTUAL_MODULE_ID } from "../vite/virtual-modules"
import { createSpeculationRules, resolveNavigationHead, VIEW_TRANSITION_CSS } from "./navigation"

describe("resolveNavigationHead", () => {
  const build = { deploymentBase: "/", dev: false }

  it("adds nothing by default", () => {
    expect(resolveNavigationHead(undefined, build)).toBeUndefined()
    expect(resolveNavigationHead({}, build)).toBeUndefined()
    const off = { viewTransitions: false, speculation: false } as const
    expect(resolveNavigationHead(off, build)).toBeUndefined()
  })

  it("opts into view transitions only without a reduced-motion preference", () => {
    expect(resolveNavigationHead({ viewTransitions: true }, build)).toStrictEqual({
      viewTransitionCss: VIEW_TRANSITION_CSS,
    })
    expect(VIEW_TRANSITION_CSS).toMatch(
      /^@media \(prefers-reduced-motion:no-preference\)\{@view-transition\{navigation:auto\}\}/u
    )
  })

  it("speculates in production builds and keeps the dev server quiet", () => {
    const navigation = { viewTransitions: true, speculation: "prerender" } as const

    expect(resolveNavigationHead(navigation, build)?.speculationRules).toStrictEqual(
      createSpeculationRules("prerender", "/")
    )
    expect(resolveNavigationHead(navigation, { ...build, dev: true })).toStrictEqual({
      viewTransitionCss: VIEW_TRANSITION_CSS,
    })
  })
})

describe("createSpeculationRules", () => {
  it("limits moderate speculation to page links below the deployment base", () => {
    expect(createSpeculationRules("prefetch", "/docs/")).toStrictEqual({
      prefetch: [
        {
          source: "document",
          where: {
            and: [
              { href_matches: "/docs/*" },
              { not: { href_matches: "/docs/*.*" } },
              {
                not: {
                  selector_matches:
                    "[download], [target], [rel~='nofollow'], [data-ardo-no-speculation]",
                },
              },
            ],
          },
          eagerness: "moderate",
        },
      ],
    })
  })
})

describe("navigation config", () => {
  it("defaults to an empty object", () => {
    expect(resolveConfig({ title: "Test" }, "/project").navigation).toStrictEqual({})
  })

  it("reaches the server render through the virtual config module", async () => {
    const navigation = { viewTransitions: true, speculation: "prefetch" } as const
    const state = {
      routesDir: "/project/app/routes",
      resolvedConfig: resolveConfig({ title: "Test", navigation }, "/project"),
    }
    const code = await loadVirtualModule(RESOLVED_IDS[VIRTUAL_MODULE_ID], state)

    expect(JSON.parse(code!.slice("export default ".length)).navigation).toStrictEqual(navigation)
  })

  it("rejects values the head cannot render", () => {
    expect(() =>
      resolveConfig({ title: "Test", navigation: { viewTransitions: "yes" } as never }, "/project")
    ).toThrow("navigation.viewTransitions must be true or false.")
    expect(() =>
      resolveConfig({ title: "Test", navigation: { speculation: "eager" } as never }, "/project")
    ).toThrow('navigation.speculation must be false, "prefetch", or "prerender".')
    expect(() => resolveConfig({ title: "Test", navigation: true as never }, "/project")).toThrow(
      "navigation must be an object."
    )
  })
})
