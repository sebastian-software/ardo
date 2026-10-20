import type * as NativeAst from "typescript/ast"
import type * as NativeCompiler from "typescript/async"

export type { NativeAst, NativeCompiler }

// The snapshot, emit and module resolution API Ardo reads arrived in
// TypeScript 7.1; 7.0's `unstable/` API lacks it. Projects set up for the Ardo 6
// previews installed the 7.1 preview as the `@typescript/native` alias, so that
// path still works.
const COMPILER_SPECIFIERS = ["typescript/async", "@typescript/native/async"] as const
const AST_SPECIFIERS = ["typescript/ast", "@typescript/native/ast"] as const

const INSTALL_HINT =
  "[ardo:api] Source API documentation requires the native TypeScript 7.1 API. Install typescript@7.1.0-dev.20261011.1 or a later 7.1 release in the documentation package."

async function importFirst(specifiers: readonly string[]): Promise<unknown> {
  let firstError: unknown
  for (const specifier of specifiers) {
    try {
      return await import(/* @vite-ignore */ specifier)
    } catch (error) {
      firstError ??= error
    }
  }
  throw new Error(INSTALL_HINT, { cause: firstError })
}

/** Loads the native TypeScript 7 compiler API from whichever path the installed version provides. */
export async function loadNativeCompiler(): Promise<typeof NativeCompiler> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- the specifiers all resolve to this module shape
  return (await importFirst(COMPILER_SPECIFIERS)) as typeof NativeCompiler
}

/** Loads the native TypeScript 7 AST helpers from whichever path the installed version provides. */
export async function loadNativeAst(): Promise<typeof NativeAst> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- the specifiers all resolve to this module shape
  return (await importFirst(AST_SPECIFIERS)) as typeof NativeAst
}
