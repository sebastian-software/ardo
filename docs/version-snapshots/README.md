# Version Snapshots

GitHub Pages replaces the full published artifact on every deployment. The current build contains
one major version; older versions must be retained as immutable static snapshots.

This repository stores compressed snapshots in `v3.tar.gz` and `v4.tar.gz`. Each archive contains only
its own version folder, including pre-rendered HTML and all referenced versioned assets.
`snapshots.json` records the source commit and SHA-256 checksum. No historical build or network
download is required during deployment.

- `v3` preserves the site published on July 13, 2026, at `/v3/`. That deployment already contained
  Ardo 4.2 documentation with an outdated URL version. Keep its existing URLs and content intact.
- `v4` was built from `2a7b43a5bcddaba285ec5cbbf62b9c4183f4d963`, the last `main` commit before the
  Ardo 5 compiler migration, with its frozen lockfile. Its configuration already uses `/v4/`.

## Prepare the Complete Artifact

After building the current documentation, run:

```sh
pnpm docs:prepare-pages
```

The script combines `docs/build/client` with every older version listed in `versions.json`, writing
the complete artifact to `docs/build/pages`. Both CI and the Pages deployment run this command.
Missing manifests, missing or empty version homepages, and invalid snapshots fail the check. The
previous artifact remains intact if validation fails.

Unpacked folders such as `docs/version-snapshots/v3/` are still supported. Archive snapshots are
checked against `snapshots.json` before extraction, and may contain only regular files and
directories inside their version folder.

## Before Switching to a New Major Version

1. Build the final documentation for the outgoing major with its original source and lockfile:
   `pnpm install --frozen-lockfile`, `pnpm build`, and `pnpm docs:build`.
2. Archive the complete version folder, not the root redirect or metadata:

   ```sh
   tar -czf docs/version-snapshots/v5.tar.gz -C docs/build/client v5
   shasum -a 256 docs/version-snapshots/v5.tar.gz
   ```

3. Add a `v5` entry to `snapshots.json` with `sourceCommit`, `capturedAt`, and the resulting `sha256`.
   Commit the archive and its metadata before changing the current version.
4. Update both `docs/vite.config.ts` and `docs/react-router.config.ts` to the new major, rebuild, and
   run `pnpm docs:prepare-pages`. Verify that the root redirects to the new major and that retained
   version pages and assets still load.

Use an isolated checkout when recreating historical builds. Never relabel the current documentation
as an older major to satisfy the snapshot check.
