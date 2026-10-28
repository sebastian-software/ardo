import type { ReactNode } from "react"
import { useArdoLocale, useArdoPath } from "ardo/runtime"
import { ArdoDocContent, ArdoNote } from "ardo/ui"
import { t } from "@palamedes/core/macro"

/** Generated declarations retain the language of the package's source comments. */
export function LocalizedContent({ children }: { children: ReactNode }) {
  const locale = useArdoLocale()
  const reference = useArdoPath().startsWith(`/${locale}/api-reference`)
  return (
    <ArdoDocContent>
      {reference && locale !== "en" && (
        <ArdoNote>
          {t`This API reference is generated from the English TypeScript source comments. Names, signatures, and examples match the published package.`}
        </ArdoNote>
      )}
      {reference ? <div lang="en">{children}</div> : children}
    </ArdoDocContent>
  )
}
