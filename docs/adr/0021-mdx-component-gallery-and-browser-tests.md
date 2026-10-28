# ADR 0021: Review components in the MDX gallery and test browser interactions

## Status

Accepted, 2026-10-22. Supersedes [ADR 0012](0012-storybook-for-ui-components.md).

## Context

Storybook introduced isolated previews when Ardo had no component overview.
The project now has its own Markdown/MDX pipeline, default documentation shell,
and Playwright browser suite. The separate Storybook build needs its own
provider setup, configuration, deployment artifact, and browser runner. Its
render smoke checks do not establish that readers can operate the controls.

The default theme is part of the product being evaluated. Component examples
should also prove that Ardo's MDX, styles, hydration, and site shell work
together through the same path used by documentation sites.

## Decision

Use the **Component Gallery** in the documentation site as the maintained
component overview. Keep its established `/guide/component-playground/` route
so existing inbound links continue to work. Render the public authoring
components through MDX and small React examples, inside the real default shell.
Use the page's header, search, sidebar, theme control, and mobile navigation as
live examples rather than rendering a duplicate mocked shell.

Use the existing Playwright suite against the built docs for important pointer,
keyboard, focus, clipboard, and recovery behavior. Keep focused unit tests for
component logic and edge cases. A gallery that renders successfully is visual
reference material; behavior claims require interaction assertions.

Remove Storybook stories, configuration, dependencies, runner, CI jobs, and its
separate deployment artifact. The gallery uses the ordinary docs development,
build, and deployment commands. Contributor instructions own the commands and
the tests own the exact assertions.

## Consequences

- Readers and contributors inspect examples in the same product they use, and
  component documentation follows the normal versioned docs output.
- One application and browser toolchain replaces a separate preview build and
  runner. Component examples must remain within the docs performance budgets.
- Storybook's isolated canvas, controls, and addons are no longer available.
  Unusual component states need a focused React example or test fixture.
- Adding a component includes an understandable MDX example; interactive changes
  also need browser coverage for the affected user behavior.

Revisit this decision if the integrated gallery prevents essential state
isolation or accessibility checks that focused examples and Playwright cannot
provide without complicating the documentation experience.

## References

- [Component Gallery](../app/content/guide/components.mdx)
- [Contributor workflow](../../CONTRIBUTING.md)
- [Browser tests](../../tests/e2e/)
