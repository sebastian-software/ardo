# Product

## Register

product

(The docs-site landing page at `docs/app/routes/home.tsx` is the one surface that runs in the **brand** register. Everything else — sidebar, content, search, code blocks — serves readers who are mid-task.)

## Users

Two audiences, one product:

1. **Framework adopters** — React/TypeScript engineers evaluating docs tooling. They compare Ardo against VitePress, Starlight, Docusaurus, Fumadocs and Mintlify. They judge the framework by its default theme within seconds: if the default looks generic, the framework reads as immature.
2. **Docs readers** — developers using sites built with Ardo. They are mid-task (integrating an API, debugging), want fast scanning, excellent code blocks, and zero visual noise.

## Product Purpose

Ardo is a static documentation framework for React teams: React 19, React Router, Vite, MDX, TypeDoc, Vanilla Extract. It exists because there was no modern, lightweight, React-native docs solution — the founder looked for one and it simply wasn't there. Success: a React team scaffolds a site, the default theme looks like someone cared, and they ship without touching a single style — yet can re-theme everything from three hue numbers.

## Brand Personality

Crafted, honest, engineering-grade. "The default theme is the proof of quality." Warm confidence, no hype: claims are verifiable (bundle size, build model, ownership). The visual voice: calm documentation surfaces with deliberate moments of depth (soft layered shadows, quiet brand-tinted washes), never loud.

## Anti-references

- The 2024/25 AI-slop kit: cyan-purple gradients on dark, glassmorphism cards, gradient headline text, glow borders.
- Docusaurus-default genericness (the "nobody themed this" look).
- Mintlify's enterprise-SaaS gloss (Ardo is open source and self-hosted; it should not cosplay a cloud platform).
- Marketing buzzwords: seamless, blazing, supercharge, world-class.

## Design Principles

1. **Practice what you preach** — the default theme is the framework's strongest marketing asset; every surface must look intentionally designed.
2. **Hue-derived everything** — every new color, shadow, gradient or texture must be computed from the three theme hues (`brand`, `accent`, `neutral`) or neutral alpha. Custom brand colors must keep working with zero extra config.
3. **Depth without noise** — layered soft shadows, subtle surface gradients, 1px precision; decoration never competes with content.
4. **Readers are mid-task** — docs UI stays calm and fast; the landing page may be bolder, the reading surface may not.
5. **Honest copy** — specific verifiable claims and a personal founder "why" beat superlatives.

## Accessibility & Inclusion

- WCAG AA: body text ≥ 4.5:1, large text ≥ 3:1, in both light and dark themes and across custom hues.
- Every animation respects `prefers-reduced-motion`.
- Keyboard-complete: search, theme toggle, mobile drawer already tested — keep it that way.
