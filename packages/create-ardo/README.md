# create-ardo

Scaffold a modern, open Ardo documentation site for React teams.

`create-ardo` creates a working React Router + Vite + Ardo project with MDX-ready routes, Tailwind CSS v4, static prerendering, and an optional GitHub Pages workflow. It is the fastest way to start writing docs without hand-assembling the React Router shell.

## Usage

```bash
# npm
npm create ardo@latest

# pnpm
pnpm create ardo@latest

# yarn
yarn create ardo

# bun
bun create ardo
```

### Specify project name

```bash
pnpm create ardo@latest my-docs
```

### Non-interactive

```bash
pnpm create ardo@latest my-docs minimal
```

## What gets created

```text
my-docs/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages deployment
├── app/
│   ├── app.css                 # Tailwind v4 utility layers
│   ├── entry.client.tsx
│   ├── entry.server.tsx
│   ├── root.tsx                # ArdoRoot + React Router shell
│   ├── routes.ts
│   └── routes/
│       └── home.tsx
├── vite.config.ts              # Vite + ardo() plugin
├── react-router.config.ts      # Static prerender config
├── tsconfig.json
├── package.json
└── pnpm-workspace.yaml
```

## After creation

```bash
cd my-docs
pnpm install
pnpm dev
```

Open `http://localhost:5173`, add MDX files under `app/routes/`, and Ardo will include them in the generated docs navigation.

## License

[MIT](../../LICENSE) © [Sebastian Software GmbH](https://sebastian-software.de)
