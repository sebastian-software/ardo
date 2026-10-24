declare module "*.po" {
  const messages: import("@palamedes/core/compiled").CompiledCatalogMessages
  export { messages }
}

declare module "*.mdx?palamedes" {
  const Content: import("react").ComponentType
  export default Content
}
