# JSX Navigation Redesign

Date: 2026-07-08
Status: Design record

## Goal

Ardo navigation should feel like React composition, not a second configuration language. Header links,
the left icon rail, sidebar sections, sidebar groups, and footer chrome should be defined together in
JSX. The Vite `ardo()` config should stay focused on build-time concerns such as Markdown, TypeDoc,
SEO, redirects, link checking, and brand defaults.

## Current Problem

The current public API splits site chrome across several places:

- Header links live in `ArdoRoot` `headerProps.nav`.
- The icon rail lives in `ArdoRoot` `contexts`.
- Sidebar data is imported from `virtual:ardo/sidebar` or `virtual:ardo/sidebars`.
- Sidebar ordering partly comes from route files and frontmatter.

That makes simple site navigation harder to understand than it should be. It also exposes two sidebar
models, singular and plural, even though the layout always includes the left rail.

## Target API

Ardo should expose compound components for site chrome:

```tsx
<ArdoRoot config={config}>
  <ArdoHeader logo={brandLogo} searchPlaceholder="Search documentation...">
    <ArdoNav>
      <ArdoNavLink to="/guide/getting-started">Guide</ArdoNavLink>
      <ArdoNavLink to="/api-reference">API</ArdoNavLink>
    </ArdoNav>

    <ArdoHeaderActions>
      <ArdoSocialLink href="https://github.com/example/project" icon="github" />
    </ArdoHeaderActions>
  </ArdoHeader>

  <ArdoSidebar>
    <ArdoSidebarSection id="guide" label="Guide" to="/guide/getting-started" icon={<BookOpen />}>
      <ArdoSidebarGroup title="Guide">
        <ArdoSidebarLink to="/guide/getting-started">Getting Started</ArdoSidebarLink>
        <ArdoSidebarLink to="/guide/configuration">Configuration</ArdoSidebarLink>
      </ArdoSidebarGroup>
    </ArdoSidebarSection>

    <ArdoSidebarSection id="api-reference" label="API" to="/api-reference" icon={<Code2 />}>
      <ArdoSidebarLink to="/api-reference">Overview</ArdoSidebarLink>
    </ArdoSidebarSection>
  </ArdoSidebar>

  <ArdoFooter
    sponsor={{ text: "Sebastian Software", link: "https://sebastian-software.com/oss" }}
    message="Released under the MIT License."
  />
</ArdoRoot>
```

`ArdoSidebarSection` defines both sides of the left navigation:

- the rail item: `id`, `label`, `to`, and optional `icon`
- the panel content: its child `ArdoSidebarGroup` and `ArdoSidebarLink` components

The icon rail and the adjacent sidebar panel should not be configured separately.

## Generated Navigation

Markdown and TypeDoc navigation can remain as a convenience, but it should be expressed through JSX.
Users should not import generated virtual sidebar modules directly in normal app code.

```tsx
<ArdoSidebar>
  <ArdoSidebarSection id="guide" label="Guide" to="/guide/getting-started">
    <ArdoGeneratedSidebar section="guide" />
  </ArdoSidebarSection>

  <ArdoSidebarSection id="api-reference" label="API" to="/api-reference">
    <ArdoGeneratedSidebar section="api-reference" />
  </ArdoSidebarSection>
</ArdoSidebar>
```

`ArdoGeneratedSidebar` reads the generated Markdown and TypeDoc sidebar data internally. The public
API should not require users to choose between `virtual:ardo/sidebar` and `virtual:ardo/sidebars`.

## Breaking Changes

This should be a deliberate breaking change. Remove the old public chrome props instead of keeping a
long transitional surface.

Remove from `ArdoRootProps`:

- `sidebar`
- `contexts`
- `header`
- `sidebarContent`
- `footer`
- `headerProps`
- `sidebarProps`
- `footerProps`

Remove from the primary public docs and templates:

- direct imports from `virtual:ardo/sidebar`
- direct imports from `virtual:ardo/sidebars`
- the singular versus plural sidebar distinction
- `contexts` as a separate user-facing model

Keep `virtual:ardo/config` because runtime still needs resolved build-time configuration.

## Runtime Behavior

`ArdoRoot` still owns the app shell and renders the React Router `Outlet`. Its children define chrome,
not page content.

When an `ArdoSidebar` contains multiple `ArdoSidebarSection` children:

- the rail always renders
- each section contributes one rail item
- the active section is selected from the current route path
- the active section's children render in the sidebar panel
- `useArdoSidebar()` exposes the active section's sidebar links for current-page helpers

When there is one section, the rail still renders as part of the fixed layout model.

## Compatibility Policy

This redesign is intended for the next breaking release. The implementation should not preserve the
old API in parallel unless a specific release requirement appears before implementation starts.

Existing apps should migrate by moving chrome definitions from `ArdoRoot` props and virtual sidebar
imports into JSX children under `ArdoRoot`.

## Documentation Work

Update the docs to lead with the JSX model:

- Getting Started should show `ArdoRoot` with `ArdoHeader`, `ArdoSidebar`, and `ArdoFooter`.
- Site UI docs should explain the compound components before generated navigation.
- Frontmatter docs should describe how frontmatter affects `ArdoGeneratedSidebar`.
- Configuration docs should stop presenting sidebar shape as a primary config surface.
- The scaffold template should use the JSX-first chrome layout.

## Testing

Add focused tests for:

- `ArdoSidebarSection` rail item rendering
- active section selection from current route
- sidebar panel switching between sections
- `ArdoGeneratedSidebar section="..."` rendering generated data
- `useArdoSidebar()` exposing active section links
- `ArdoRoot` extracting header, sidebar, and footer children

Update existing shell and sidebar tests to remove old `contexts` and `sidebar` prop coverage.

## Non-Goals

- Do not add a large JSON-like `navigation={{ ... }}` prop.
- Do not move navigation into `ardo()` config.
- Do not keep singular and plural sidebar modules as first-class public concepts.
- Do not make route-generated navigation the default mental model for the whole chrome API.
