# ADR 0014: LLMs.txt for LLM-Optimized Documentation

## Status

Accepted

## Context

Documentation existed only in HTML/web format. LLMs needed to crawl and parse the full website to understand the framework, which is inefficient and often incomplete. As AI-assisted development becomes mainstream, providing machine-optimized documentation formats is increasingly valuable.

## Decision

Provide two generated text files optimized for LLM consumption, served from the docs site root:

- **`llms.txt`** — Concise index with links to major documentation sections and key concepts.
- **`llms-full.txt`** — Complete documentation as a single markdown file with full content and runnable examples.

## Consequences

### Files

- `/llms.txt` — Generated navigation index with links and page descriptions
- `/llms-full.txt` — Generated complete documentation in markdown

### Benefits

- LLMs can fetch a single, well-structured text file instead of scraping HTML
- Content format optimized for token efficiency (markdown vs. HTML)
- Easy to reference in LLM prompts and AI coding assistants
- Complete runnable examples included in the full file
- Future-proofs documentation for AI-assisted development workflows

### Trade-offs

- Generated output may need project-specific exclusions for content that is useful in HTML but noisy
  in LLM context
