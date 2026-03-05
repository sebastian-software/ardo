# ADR 0014: LLMs.txt for LLM-Optimized Documentation

## Status

Accepted

## Context

Documentation existed only in HTML/web format. LLMs needed to crawl and parse the full website to understand the framework, which is inefficient and often incomplete. As AI-assisted development becomes mainstream, providing machine-optimized documentation formats is increasingly valuable.

## Decision

Provide two static text files optimized for LLM consumption, served from the docs site root:

- **`llms.txt`** — Concise index with links to major documentation sections and key concepts.
- **`llms-full.txt`** — Complete documentation as a single markdown file with full content and runnable examples.

## Consequences

### Files

- `/docs/public/llms.txt` (~3KB) — Navigation index with quick concepts
- `/docs/public/llms-full.txt` (~13KB) — Complete documentation in markdown

### Benefits

- LLMs can fetch a single, well-structured text file instead of scraping HTML
- Content format optimized for token efficiency (markdown vs. HTML)
- Easy to reference in LLM prompts and AI coding assistants
- Complete runnable examples included in the full file
- Future-proofs documentation for AI-assisted development workflows

### Trade-offs

- Files must be kept in sync with the actual documentation manually
- Additional maintenance burden when docs change significantly
