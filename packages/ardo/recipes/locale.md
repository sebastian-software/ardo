---
name: locale
description: Add a language as a complete static route tree, with a locale switcher and translated interface labels.
---

# Add a locale

Ardo builds each configured locale as its own static route tree under `app/routes/<locale>/`. A missing translation fails the build, which names the route and locale. Ardo never serves another language in its place.

## Check the existing setup

- Read `ardo.config.ts`. If `i18n.locales` already lists the new id and `app/routes/<id>/` contains every route, stop. The locale is set up.
- If `i18n` is `false` or missing, this is the first localized build. Plan the default locale too.

## Inspect the project

- List the route files under `app/routes/`. Every route must move under a locale directory, and each locale must use the same route slugs.
- With `i18n` active, every public URL includes its locale, including the default one. Existing unprefixed URLs change. Set `redirectUnlocalized: true` to redirect them during migration.
- Read `app/root.tsx` for `<ArdoRoot>` and any `labels`. Interface labels default to English.
- If `versioning` is set, each version's `locales` list decides which locales it serves. See the `version` recipe.
- Set `siteUrl` if canonical and alternate-language links are needed.

## Confirm the plan

State the new locale id and label, the default locale, the routes to translate, and the interface labels to translate. Ask whether the user supplies the translations or the agent drafts them. Ask for confirmation before editing.

## Apply the change

1. Add the locale in `ardo.config.ts`:

   ```ts
   import { defineArdoConfig } from "ardo/config"

   export default defineArdoConfig({
     title: "My Docs",
     i18n: {
       defaultLocale: "en",
       locales: [
         { id: "en", label: "English" },
         { id: "de", label: "Deutsch" },
       ],
     },
   })
   ```

2. Move the existing routes into `app/routes/<defaultLocale>/`. Copy each route into `app/routes/<locale>/` with the same slug, and translate the prose, frontmatter `title`, and `description`. Keep code, imports, identifiers, and component names unchanged.
3. Translate the interface labels. In `app/root.tsx`, pass the labels for the active locale to `<ArdoRoot labels={...}>`. Type them as `ArdoLabelsInput` from `ardo/ui`. Every key is optional, and untranslated keys stay English. Select the set with `useArdoLocale()` from `ardo/runtime`.
4. In custom components, use `useArdoLocale()` wherever text depends on the locale.

## Verify

- Run `pnpm build`. Fix every missing translation it reports. The build must report no broken internal links.
- Check that `build/client/<locale>/index.html` has the locale's `lang` and that every default-locale route has a counterpart.
- If `ardo check` is available in the installed version, run it.
