# ADR 0022: Theme and Site Assets in JSX

## Status

Accepted. Amends [ADR 0010](0010-brand-color-via-single-hue.md) and
[ADR 0019](0019-chroma-multipliers-next-to-hues.md): the hues and chroma multipliers stay, the
place to set them moves.

## Context

Ardo 5 had two theming APIs with two schemas. `brand` in `ardo.config.ts` took `color`, `accent`,
and `neutral`, with chroma keys of the same names. `applyBrandTheme` in a `.css.ts` file took
`primary`, `secondary`, and `neutral`, with the chroma key `brand`. Each had its own resolver, and
they had drifted: only the config normalized negative hues, checked numbers, and knew the presets.
The brand applied only inside `ArdoRoot`, so a root built from `ArdoLayout` lost it without a
warning.

Logo and favicon were paths in the config. The plugin turned a local logo into an import behind
the scenes, and the favicons generated from it kept fixed file names. Callout colors had fixed
hues: Ardo's own docs needed six overrides because the warning clashed with its accent. The `gray`
and `slate` presets were a saturated blue.

## Decision

The theme is a prop. `<ArdoRoot theme={…}>` takes one schema: `color`, `accent`, `neutral`,
`chroma`, `status` for the callout hues, `fonts`, and `tokens`, `light`, and `dark` for any design
token. `<ArdoTheme>` takes the same props for a root that composes its own shell. It renders the CSS
variables into an unlayered `<style>` element in the page. Light and dark tokens are scoped to
`:root:not(.dark)` and `:root.dark`, because unlayered CSS beats both of the `ardo` layer's
selectors.

Logo and favicon are imported files on `ArdoRoot`: `logo`, `icon`, and `appleTouchIcon`. Vite
fingerprints them. The server renders the page before its HTML shell, so `ArdoRoot` hands its icons
to a collector and the shell links them in `<head>`.

- Removed: `brand`, `icons.source`, `applyBrandTheme`, and `createTheme`. `ardo/theme` exports
  `vars` only. A config that sets `brand` fails with a pointer to the `theme` and `logo` props.
- `ArdoRootLayout`'s `theme` and `favicon` props become `colorScheme` and `icon`, so `theme` means
  one thing across the API.
- Callout hues are tokens, `--ardo-hue-tip` through `--ardo-hue-note`. The contrast test now checks
  every preset as a callout hue; light warning text dropped from lightness 0.55 to 0.51 to pass it.
- Presets carry chroma: `gray` is achromatic in every role, `slate` is muted to 0.3 as brand or
  accent.
- Six color tokens that no component read are gone: `brandLight`, `accentLight`, `accentDark`,
  `accentSubtle`, `bgAlt`, and `sidebarBorder`.
- Headings follow `--ardo-font-family` unless a theme sets `heading`.

## Consequences

- The config holds what the build needs. Everything a reader sees, colors and assets included, is
  set in `app/root.tsx`.
- Every page ships the theme CSS generator, about 1.3 KB gzip, because the client renders the same
  `<style>` while it hydrates.
- Without `icon`, the generated owl icons stay. Rasterized favicons from a site's own SVG are gone;
  a site that wants its own `favicon.ico` puts it in `public/`.
- Upgrading sites move `brand` and `applyBrandTheme` calls into the `theme` prop; the upgrade guide
  lists the renamed keys.
