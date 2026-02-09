---
title: Store
description: A simple key-value store.
---

[API](/api-reference) / [classes](/api-reference/classes) / store

# Class: Store

A simple key-value store.

## Type Parameters

| Name | Constraint | Default | Description |
| ---- | ---------- | ------- | ----------- |
| T    | -          | -       | -           |

## Methods

### get()

Retrieves a value by key.

```typescript
function get(key: string): T | undefined
```

### Parameters

| Name | Type     | Description        |
| ---- | -------- | ------------------ |
| key  | `string` | The key to look up |

### Returns

`T | undefined`

The stored value, or undefined if not found

### set()

Stores a value with the given key.

```typescript
function set(key: string, value: T): void
```

### Parameters

| Name  | Type     | Description            |
| ----- | -------- | ---------------------- |
| key   | `string` | The key to store under |
| value | `T`      | The value to store     |

### has()

Checks whether a key exists in the store.

```typescript
function has(key: string): boolean
```

### Parameters

| Name | Type     | Description      |
| ---- | -------- | ---------------- |
| key  | `string` | The key to check |

### Returns

`boolean`

True if the key exists

### delete()

Removes a key from the store.

```typescript
function delete(key: string): boolean
```

### Parameters

| Name | Type     | Description       |
| ---- | -------- | ----------------- |
| key  | `string` | The key to remove |

### Returns

`boolean`

True if the key was found and removed

## Source

index.ts:23

## Examples

```ts
const store = new Store<string>()
store.set("key", "value")
console.log(store.get("key")) // "value"
```
