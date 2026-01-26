---
title: Getting Started
---

# Getting Started

Welcome to your new documentation site!

## Installation

This project was created using the Ardo minimal template.

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## Project Structure

```
my-docs/
├── content/           # Your markdown files
│   ├── index.md       # Homepage
│   └── guide/
│       └── getting-started.md
├── vite.config.ts     # Ardo configuration
├── tsconfig.json      # TypeScript config
└── package.json
```

## Writing Content

Create `.md` or `.mdx` files in the `content/` directory. They will automatically become pages.

### Frontmatter

Each page can have frontmatter:

```yaml
---
title: Page Title
description: Page description for SEO
---
```

## Next Steps

- Explore the [Ardo documentation](https://sebastian-software.github.io/ardo/)
- Customize your theme in `vite.config.ts`
- Add more pages to the `content/` directory
