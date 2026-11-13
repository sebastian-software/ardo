# ADR 0026: Own Accordion without Base UI

## Status

Accepted. Supersedes [ADR 0015](./0015-base-ui-interaction-layer.md).

## Context

ADR 0015 adopted Base UI as the foundation for interactive components and expected tooltips, popovers, dialogs, and menus to follow the Accordion. None followed. One year later the accordion was still the only component built on Base UI, and Ardo's search dialog, tabs, and mobile navigation stayed hand-written.

The cost did not stay limited to the components in use. Tree-shaking keeps unused primitives out of the client bundle, but not out of the install: every Ardo user downloads the whole `@base-ui/react` package (10.4 MB unpacked) and its dependency tree for a single accordion. Base UI also needed its own entries in Ardo's managed optimizer includes.

The accordion's behavior is small and well specified by the [WAI-ARIA APG accordion pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/): a heading that wraps a native button, a labelled region, and optional arrow-key navigation between triggers. The one browser edge case worth care, find-in-page through `hidden="until-found"` and `beforematch`, needs a few lines.

## Decision

Ardo implements the accordion itself, following the APG pattern, without a new dependency:

1. **Markup.** The trigger is a native `<button type="button">` with `aria-expanded` and `aria-controls`, wrapped in the configurable heading level (`headingLevel`). The panel is a `role="region"` labelled by its trigger.
2. **Keyboard.** The native button provides Enter and Space. Inside `ArdoAccordionGroup`, ArrowDown/ArrowUp move focus between the group's own triggers with wrap-around, and Home/End jump to the first and last trigger. Triggers of nested groups belong to their own group.
3. **Find-in-page.** Collapsed panels stay in the prerendered HTML. React renders `hidden` only as a boolean, so the panel prerenders as `hidden=""` and switches to `hidden="until-found"` after hydration, the same timing Base UI had. A `beforematch` event opens the item without the height transition, so the match is visible immediately.
4. **Styling and motion.** Vanilla Extract styles keep the attribute contract the component already used: `data-open` on the open item, `data-starting-style` / `data-ending-style` during the first and last transition frame, and `--accordion-panel-height` while the height transitions. Once open, the panel height returns to `auto`. With reduced motion there is no transition, and the panel opens and closes at once.
5. **Public API unchanged.** `ArdoAccordion` and `ArdoAccordionGroup` keep their props (`title`, `children`, `defaultOpen`, `icon`, `headingLevel`, `value`, `className`, `onlyOneOpen`).

For future interactive components, the rules from ADR 0015 that remain valid continue:

- **Ardo owns the public API and the styling** (per ADR 0006 and ADR 0004).
- **SSR/static-first defaults.** Collapsed or deferred content must be present in the prerendered HTML.
- **Prefer the platform and a small own implementation.** Before adding a dependency for an interaction, check whether native elements (`<dialog>`, `popover`, `<details>`) and a WAI-ARIA pattern cover it.
- **A focused library where the interaction is hard.** When a component's core interaction is substantially harder than an APG pattern, a small library with no dependencies of its own may provide it. `CompareSlider` uses [react-compare-slider](https://github.com/nerdyman/react-compare-slider) for its compare clip and handle-only touch dragging (added 2026-11-09).

## Consequences

### Benefits

- `@base-ui/react` and its dependency tree leave every Ardo installation.
- The accordion is a small own implementation with no part structure to learn. `Accordion.tsx` holds the component; since 2026-11-14 its height transition lives in `collapsible-panel.ts`, and the find-in-page handling it shares with tabs and code groups in `disclosure.ts`.
- The managed runtime optimizer no longer needs a Base UI entry.

### Trade-offs

- Ardo maintains the accordion's keyboard behavior, focus handling, and `beforematch` handling itself. Unit, jsdom interaction, and Playwright tests cover them.
- The height transition uses `getAnimations()` to know when a close has finished. Browsers without it close without waiting.
- Find-in-page reaches collapsed panels only after hydration, as before.
