/**
 * Runtime exports for use in the app (browser + SSR React).
 * This module contains only React-compatible code with no Node.js-only dependencies.
 */

// React hooks and context
export {
  ArdoConfigProvider,
  ArdoContext,
  ArdoPageDataProvider,
  ArdoProvider,
  ArdoSiteConfigProvider,
  useArdoConfig,
  useArdoContext,
  useArdoLabels,
  useArdoPageData,
  useArdoSidebar,
  useArdoSiteConfig,
  useArdoTOC,
} from "./hooks"
export type { ArdoSiteConfig } from "./hooks"

// Pages, links, and the HTML document
export { ArdoHead, ArdoScripts } from "./document"
export { ArdoActiveLink, ArdoLink, ArdoOutlet, ArdoPageProvider } from "./page"
export type { ArdoActiveLinkProps, ArdoLinkProps, ArdoPageProviderProps } from "./page"
export {
  navigateTo,
  resolveArdoHref,
  useArdoHref,
  useArdoPage,
  useArdoPath,
  useIsActivePath,
} from "./page-context"
export type { ArdoMetaDescriptor, ArdoMetaFunction, ArdoPage, ArdoPageError } from "./page-context"

// Client-safe sidebar utilities
export { findCurrentSidebarItem, getPrevNextLinks } from "./sidebar-utils"
