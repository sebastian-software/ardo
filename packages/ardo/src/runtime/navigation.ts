import type { NavigationConfig } from "../config/types"

/** Head content that changes how the browser moves between pages. */
export type ArdoNavigationHead = {
  /** Stylesheet text that opts the page into cross-document view transitions. */
  viewTransitionCss?: string
  /** Speculation rules, rendered as a `speculationrules` script. */
  speculationRules?: Record<string, unknown>
}

/**
 * Both documents of a navigation must opt in, and every Ardo page carries the same rule. The
 * header, sidebar, and footer look the same on both pages, so the root cross-fade only shows the
 * content changing. Readers who prefer reduced motion get a plain navigation.
 */
export const VIEW_TRANSITION_CSS =
  "@media (prefers-reduced-motion:no-preference){@view-transition{navigation:auto}}" +
  "::view-transition-old(root),::view-transition-new(root){animation-duration:150ms}"

/**
 * Links that leave the page tree: file downloads, new windows, and generated files such as
 * `llms.txt` or a page's Markdown. A link can also opt out with `data-ardo-no-speculation`.
 */
const NOT_SPECULATED_LINKS = "[download], [target], [rel~='nofollow'], [data-ardo-no-speculation]"

/**
 * Speculation rules for every page link below the deployment base. Moderate eagerness starts
 * after the pointer rests on a link for a moment, or on pointer down, so a page full of links
 * does not load them all.
 */
export function createSpeculationRules(
  mode: "prefetch" | "prerender",
  deploymentBase: string
): Record<string, unknown> {
  return {
    [mode]: [
      {
        source: "document",
        where: {
          and: [
            { href_matches: `${deploymentBase}*` },
            { not: { href_matches: `${deploymentBase}*.*` } },
            { not: { selector_matches: NOT_SPECULATED_LINKS } },
          ],
        },
        eagerness: "moderate",
      },
    ],
  }
}

/** The navigation head for a page. Speculation stays off in the dev server. */
export function resolveNavigationHead(
  navigation: NavigationConfig | undefined,
  options: { deploymentBase: string; dev: boolean }
): ArdoNavigationHead | undefined {
  const speculation = options.dev ? false : (navigation?.speculation ?? false)
  const head: ArdoNavigationHead = {
    ...(navigation?.viewTransitions === true ? { viewTransitionCss: VIEW_TRANSITION_CSS } : {}),
    ...(speculation === false
      ? {}
      : { speculationRules: createSpeculationRules(speculation, options.deploymentBase) }),
  }
  return Object.keys(head).length === 0 ? undefined : head
}
