# ADR 0008: Children-Based Composition over Items Prop

## Status

Accepted

## Context

Some components accepted data through `items` arrays — a data-driven pattern that did not fit the JSX-first approach of the framework:

```tsx
// Data-driven
<Features
  items={[
    { title: "Feature 1", description: "..." },
    { title: "Feature 2", description: "..." },
  ]}
/>
```

This pattern made composition harder, prevented nested structures, and required TypeScript types for the item objects.

## Decision

Components use `children`-based composition as their primary API. Where it makes sense (e.g. Sidebar), both approaches are supported.

## Consequences

### Examples

```tsx
// Features: Children only
<ArdoFeatures title="Key Features">
  <ArdoFeatureCard title="Feature 1" icon={...}>
    Description
  </ArdoFeatureCard>
</ArdoFeatures>

// CodeBlock: Children with auto-outdent
<ArdoCodeBlock language="typescript">{`
  const x = 42
`}</ArdoCodeBlock>

// Sidebar: Both approaches supported
<ArdoSidebar>
  <ArdoSidebarGroup title="Guide">
    <ArdoSidebarLink to="/guide">Intro</ArdoSidebarLink>
  </ArdoSidebarGroup>
</ArdoSidebar>
```

### Benefits

- Natural JSX patterns with better IDE support
- Nested structures directly representable
- CodeBlock: auto-outdent with template literals
- Visual representation of hierarchy in source code

### Trade-offs

- Slightly more JSX code than compact array notation
- Sidebar deliberately supports both approaches for flexibility
