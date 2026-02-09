---
title: index Functions
description: Functions from index.ts
---

# index Functions

Functions exported from `index.ts`

## capitalize

```typescript
function capitalize(input: string): string
```

### Parameters

| Name  | Type     | Description              |
| ----- | -------- | ------------------------ |
| input | `string` | The string to capitalize |

### Returns

`string`

The capitalized string

---

## repeat

```typescript
function repeat(input: string, count: number, options?: RepeatOptions): string
```

### Parameters

| Name               | Type            | Description            |
| ------------------ | --------------- | ---------------------- |
| input              | `string`        | The string to repeat   |
| count              | `number`        | Number of repetitions  |
| options (optional) | `RepeatOptions` | Optional configuration |

### Returns

`string`

The repeated string

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

A lowercase, hyphen-separated slug

---

## truncate

```typescript
function truncate(input: string, maxLength: number, suffix: string): string
```

### Parameters

| Name      | Type     | Description                              |
| --------- | -------- | ---------------------------------------- |
| input     | `string` | The string to truncate                   |
| maxLength | `number` | Maximum length before truncation         |
| suffix    | `string` | The suffix to append (defaults to "...") |

### Returns

`string`

The truncated string

---
