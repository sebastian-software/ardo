# Ardo - Claude Code Guidelines

## Project Structure

This is a monorepo with two packages:

- `packages/ardo` - The main documentation framework
- `packages/create-ardo` - CLI scaffold tool (`pnpm create ardo`)

## Commit Convention

**Use conventional commits WITHOUT scope:**

```
feat: add new feature
fix: fix bug
refactor: improve code
```

**Do NOT use scopes like:**

```
feat(ardo): ...      # Don't do this
feat(scaffold): ...  # Don't do this
```

**Reason:** Release-please uses `linked-versions` to keep both packages synchronized. Commits without scope are attributed to all packages, ensuring correct changelog entries for both.

## Commands

- `pnpm dev` - Start docs dev server
- `pnpm build` - Build all packages
- `pnpm test` - Run tests
- `pnpm typecheck` - TypeScript check
- `pnpm lint` - ESLint

## Key Files

- `packages/ardo/src/vite/plugin.ts` - Main Vite plugin
- `packages/ardo/src/vite/routes-plugin.ts` - Route generation
- `packages/create-ardo/templates/minimal/` - Scaffold template
- `docs/` - Ardo documentation site

## TypeDoc

TypeDoc is integrated directly into the `ardo()` plugin:

```ts
ardo({
  typedoc: true, // Enable with defaults (./src/index.ts)
})
```

## Testing

Integration test scaffolds a project and builds it:

```
packages/create-ardo/src/scaffold.integration.test.ts
```
