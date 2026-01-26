# Ardo Minimal Example

A minimal documentation site built with [Ardo](https://github.com/sebastian-software/ardo).

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Structure

```
minimal/
├── content/           # Markdown content
│   ├── index.md       # Homepage
│   └── guide/
│       └── getting-started.md
├── vite.config.ts     # Ardo configuration
├── tsconfig.json      # TypeScript config
└── package.json
```

## Customization

Edit `vite.config.ts` to customize your site:

- `title` — Site title
- `description` — Site description
- `themeConfig.nav` — Navigation links
- `themeConfig.sidebar` — Sidebar navigation

See the [Ardo documentation](https://sebastian-software.github.io/ardo/) for all options.
