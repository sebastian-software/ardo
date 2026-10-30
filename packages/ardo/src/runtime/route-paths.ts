import { createContext } from "react"

/** Known page paths distinguish dotted pages from static files. */
export const ArdoRoutePathsContext = createContext<ReadonlySet<string>>(new Set())

/** Target public addresses for projects with directory-based versioning. */
export const ArdoRouteHrefsContext = createContext<ReadonlyMap<string, string>>(new Map())
