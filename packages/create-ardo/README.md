# create-ardo

Scaffolding tool for [Ardo](https://github.com/sebastian-software/ardo) documentation projects.

## Usage

```bash
# With npm
npm create ardo@latest

# With pnpm
pnpm create ardo@latest

# With yarn
yarn create ardo

# With bun
bun create ardo
```

### Specify project name

```bash
npm create ardo@latest my-docs
```

### Non-interactive

```bash
npm create ardo@latest my-docs minimal
```

## What's Created

```
my-docs/
├── content/
│   ├── index.md
│   └── guide/
│       └── getting-started.md
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .gitignore
```

## After Creation

```bash
cd my-docs
pnpm install
pnpm dev
```

## License

[MIT](../../LICENSE) © [Sebastian Software GmbH](https://sebastian-software.de)
