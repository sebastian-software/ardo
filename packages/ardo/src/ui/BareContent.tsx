import { createContext, useContext, type ReactNode } from "react"

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
export function BareContent({ children }: { children: ReactNode }) {
  return <BareContentContext value={true}>{children}</BareContentContext>
}

export function useBareContent(): boolean {
  return useContext(BareContentContext)
}
