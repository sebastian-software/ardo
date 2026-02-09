---
title: index Functions
description: Functions from index.ts
---

# index Functions

Functions exported from `index.ts`

## format

```typescript
function format(input: string, options?: FormatOptions): string
```

### Parameters

| Name               | Type            | Description                |
| ------------------ | --------------- | -------------------------- |
| input              | `string`        | The input string to format |
| options (optional) | `FormatOptions` | Formatting options         |

### Returns

`string`

The formatted string

---

## parse

```typescript
function parse(input: string, delimiter: string): string[]
```

### Parameters

| Name      | Type     | Description                                 |
| --------- | -------- | ------------------------------------------- |
| input     | `string` | The delimited string                        |
| delimiter | `string` | The delimiter to split on (defaults to ",") |

### Returns

`string[]`

An array of trimmed strings

---

## slugify

```typescript
function slugify(input: string): string
```

### Parameters

| Name  | Type     | Description           |
| ----- | -------- | --------------------- |
| input | `string` | The string to slugify |

### Returns

`string`

A URL-friendly slug

---
