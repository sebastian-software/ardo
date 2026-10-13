# Ardo - Claude Code Guidelines

## Project Structure

This workspace contains the framework, documentation, and tested reference projects:

- `packages/ardo` - The main documentation framework
- `examples/` - Reference projects used by versioned Agent Instructions

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

**Reason:** The repository uses unscoped conventional commits for Ardo's release history.

## Commands

- `pnpm dev` - Start the `ardo` package dev/watch process
- `pnpm docs:dev` - Start docs dev server
- `pnpm build` - Build all packages
- `pnpm test` - Run tests
- `pnpm typecheck` - TypeScript check
- `pnpm lint` - ESLint

## Key Files

- `packages/ardo/src/vite/plugin.ts` - Main Vite plugin
- `packages/ardo/src/vite/routes-plugin.ts` - Route generation
- `docs/app/routes/guide/agent-instructions.mdx` - Versioned setup, adoption, and upgrade instructions
- `examples/` - Integration-tested project contracts
- `docs/` - Ardo documentation site

## Native API Documentation

Native API documentation is integrated directly into the `ardo()` plugin:

```ts
ardo({
  api: true, // Enable with defaults (./src/index.ts)
})
```

## Testing

Integration tests build references and install basic/library references against the packed package:

```
examples/packed-reference.test.ts
pnpm test:integration
```
