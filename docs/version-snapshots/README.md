# Version Snapshots

GitHub Pages deploys replace the full published artifact. Keep older major-version folders here
when a new major docs version becomes current, so stable inbound links keep resolving after the next
deploy.

For example, before switching the docs build from `/v3/` to `/v4/`, add the final generated `v3`
folder at:

```text
docs/version-snapshots/v3/
```

The Pages workflow copies `docs/build/client` into a staging artifact, then fills any version folder
listed in `versions.json` that the current build did not produce from this directory. If a listed
older major version is missing from both places, the workflow fails before uploading to GitHub Pages.
