// Config (client-safe: pure types and small utility functions)
export { defineConfig, resolveConfig, loadConfig } from "./config"
export type {
  ArdoConfig,
  ResolvedConfig,
  MarkdownConfig,
  TypeDocConfig,
  SidebarItem,
  NavItem,
  SocialLink,
  PageFrontmatter,
  TOCItem,
  PageData,
  HeadConfig,
  ProjectMeta,
} from "./config"

// Runtime (React hooks and context - client-safe)
export {
  ArdoProvider,
  ArdoSiteConfigProvider,
  useArdoContext,
  useArdoConfig,
  useArdoSiteConfig,
  useArdoSidebar,
  useArdoPageData,
  useArdoTOC,
  findCurrentSidebarItem,
  getPrevNextLinks,
} from "./runtime"
export type { ArdoSiteConfig } from "./runtime"

// UI Components (client-safe)
export {
  ArdoLayout,
  ArdoHeader,
  ArdoSidebar,
  ArdoTOC,
  ArdoContent,
  ArdoFooter,
  ArdoDocPage,
  ArdoDocLayout,
  ArdoHomePage,
  ArdoThemeToggle,
  ArdoSearch,
  ArdoCodeBlock,
  ArdoCodeGroup,
  ArdoContainer,
  ArdoTip,
  ArdoWarning,
  ArdoDanger,
  ArdoInfo,
  ArdoNote,
  ArdoTabs,
  ArdoTabList,
  ArdoTab,
  ArdoTabPanel,
  ArdoTabPanels,
  ArdoCopyButton,
  ArdoHero,
  ArdoFeatures,
  ArdoFeatureCard,
} from "./ui"
export type { ArdoHeroProps, ArdoHeroAction, ArdoHeroImage } from "./ui"
export type { ArdoFeaturesProps, ArdoFeatureCardProps } from "./ui"
export type { ArdoCodeBlockProps, ArdoCodeGroupProps } from "./ui"
export type {
  ArdoContainerProps,
  ArdoContainerType,
  ArdoTipProps,
  ArdoWarningProps,
  ArdoDangerProps,
  ArdoInfoProps,
  ArdoNoteProps,
} from "./ui"
export type {
  ArdoTabsProps,
  ArdoTabListProps,
  ArdoTabProps,
  ArdoTabPanelProps,
  ArdoTabPanelsProps,
} from "./ui"

// ===========================================================================
// Server-only exports are NOT re-exported from the main entry.
// They pull in heavy Node.js dependencies (Vite, Rolldown, TypeDoc, etc.)
// that break client-side bundling. Use the dedicated subpath exports instead:
//
//   import { ardo } from "ardo/vite"         — Vite plugin & build utilities
//   import { generateApiDocs } from "ardo/typedoc"  — TypeDoc integration
// ===========================================================================
