import { createContext, type ReactNode, use } from "react"

const BareContentContext = createContext(false)

/**
 * Wraps imported MDX content to render without the full Content wrapper
 * (article, header, footer, navigation). Only the content body is rendered.
 *
 * ```tsx
 * import MySnippet from "./snippet.mdx"
 *
 * <BareContent>
 *   <MySnippet />
 * </BareContent>
 * ```
 */
export function ArdoBareContent({ children }: { children: ReactNode }) {
  return <BareContentContext value>{children}</BareContentContext>
}

export function useBareContent(): boolean {
  return use(BareContentContext)
}
