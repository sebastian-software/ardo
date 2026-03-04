/**
 * Runtime exports for use in the app (browser + SSR React).
 * This module contains only React-compatible code with no Node.js-only dependencies.
 */

// React hooks and context
export {
  useArdoContext,
  useArdoConfig,
  useArdoTheme,
  useArdoSidebar,
  useArdoPageData,
  useArdoTOC,
  ArdoProvider,
  ArdoContext,
} from "./hooks"

// Client-safe sidebar utilities
export { findCurrentSidebarItem, getPrevNextLinks } from "./sidebar-utils"
