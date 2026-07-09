# ADR 0015: Base UI as Interaction Layer

## Status

Accepted

## Context

Ardo maintains several interactive components (Accordion, Tabs, search popovers, mobile drawers) with hand-written keyboard behavior, focus management, and ARIA semantics. Each component reimplements edge cases that accessibility-focused headless libraries already solve and maintain: roving focus, `hidden="until-found"` support, portal handling, dismiss behavior, and animation-aware mounting.

As the v4.1 authoring baseline grows (tooltips, popovers, dialogs, menus are likely follow-ups), maintaining this behavior independently in every component does not scale and risks inconsistent accessibility.

## Decision

Adopt [Base UI](https://base-ui.com) (`@base-ui/react`) as the standard foundation for interactive primitives with non-trivial keyboard or focus behavior.

Rules for adoption:

1. **New interactive components use Base UI** when it provides a suitable primitive (Accordion, Tooltip, Popover, Dialog/Drawer, Menu, Select/Combobox, Tabs, and similar).
2. **Ardo owns the public API.** Components are exported as `Ardo*` wrappers (per ADR 0006). Base UI types, part names, and markup never leak into the MDX-facing API. Props remain documentation-oriented (`title`, `defaultOpen`, `onlyOneOpen`, ...), not primitive-oriented (`Root`, `value` arrays, ...).
3. **Ardo owns the styling.** Wrappers style Base UI parts through `className` with Vanilla Extract and the theme contract (per ADR 0004). State-based styling uses Base UI data attributes (`data-open`, `data-starting-style`, ...) and CSS variables (`--accordion-panel-height`, ...) instead of JS-driven styles.
4. **SSR/static-first defaults.** Ardo is a static site generator: collapsed content must be present in prerendered HTML for SEO and find-in-page. Wrappers default to `keepMounted`/`hiddenUntilFound`-style rendering where the primitive supports it.
5. **Selective migration, one implementation path.** Existing components are migrated when touched, starting with Accordion. Simple native controls (e.g. a plain button or checkbox) stay local when a primitive adds no meaningful behavior. The goal is one default implementation path, not a second permanent component stack.

## Consequences

### Benefits

- Keyboard behavior, focus management, ARIA wiring, and browser edge cases are maintained upstream by an accessibility-focused team.
- New interactive authoring components become significantly cheaper to ship and consistent by construction.
- Find-in-page (`hidden="until-found"`) and animation-aware mounting come for free.

### Trade-offs

- New runtime dependency in `ardo` (tree-shakeable per-component imports keep the cost limited to components actually used).
- Component internals follow Base UI part structure, which contributors need to learn.
- Base UI major upgrades must be validated against all wrappers.

### Bundle validation

Base UI is imported per component (`@base-ui/react/accordion`), so unused primitives are tree-shaken. The docs build budgets (see `scripts/check-budgets.mjs`) guard against unnoticed client bundle growth.
