---
name: version
description: Add a new major documentation version under its own path, keeping older majors as static folders.
---

# Add a documentation version

Ardo builds the current documentation under the path of its active version, such as `/v4/`. It also writes `versions.json`, the version switcher, and, by default, a root redirect to that version. Older majors stay as static folders from earlier deployments. Ardo does not rebuild them from the new source.

## Check the existing setup

- Read `ardo.config.ts`. If `versioning.versions` already lists the new id and `versioning.current` names it, stop. The version is set up.
- If `versioning` is missing or `false`, the project has no versions yet. Plan the new version as the first one, and tell the user that its URLs move under the version path.

## Inspect the project

- Confirm `base`, which is the deployment root, and `siteUrl`, which canonical links and the sitemap need.
- Find where the previous major is deployed: its `build/client/<path>/` folder, the CI workflow, or the host's artifact. Older versions must come from their own retained build.
- Note the source revision (tag or branch) of the outgoing major. Its content can be rebuilt only from that revision.
- Choose the scope. The default versions the whole site. `directories` versions only areas such as `guide` and `api-reference`, and keeps the home page and news unversioned. With `directories`, `rootRedirect: true` is rejected.

## Confirm the plan

State the new id, label, and path, the scope, where the outgoing folder is kept, and which URLs change for readers. Ask the user to confirm before editing.

## Apply the change

1. Keep the outgoing version's folder, such as `v3/`, in the deployment staging area. Build it from its own revision and lockfile only when no retained build exists.
2. Add the new version first in `versions`. The first entry is the latest version. Keep older entries, newest first:

   ```ts
   import { defineArdoConfig } from "ardo/config"

   export default defineArdoConfig({
     title: "My Docs",
     siteUrl: "https://docs.example.com",
     versioning: {
       current: "v4",
       versions: [
         { id: "v4", label: "4.x", path: "/v4/" },
         { id: "v3", label: "3.x", path: "/v3/" },
       ],
     },
   })
   ```

3. Build the new major from its own source, and keep `current` on the new id, because only the current version is built. If the site is also localized, give each version a `locales` list. See the `locale` recipe.

## Verify

- Run `pnpm build`. The build must report no broken internal links.
- Check that `build/client/v4/index.html` exists, that `build/client/index.html` redirects to `/v4/`, and that `build/client/versions.json` lists every version.
- Check that the retained older folders still load from the staging directory before deploying.
- If `ardo check` is available in the installed version, run it.
