import { createContext } from "react"

/** Known page paths distinguish dotted pages from static files. */
export const ArdoRoutePathsContext = createContext<ReadonlySet<string>>(new Set())
