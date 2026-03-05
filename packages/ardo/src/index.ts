// Config (client-safe: pure types and small utility functions)
export { defineConfig, loadConfig, resolveConfig } from "./config"
export type {
  ArdoConfig,
  HeadConfig,
  MarkdownConfig,
  NavItem,
  PageData,
  PageFrontmatter,
  ProjectMeta,
  ResolvedConfig,
  SidebarItem,
  SocialLink,
  TOCItem,
  TypeDocConfig,
} from "./config"

// Runtime (React hooks and context - client-safe)
export {
  ArdoProvider,
  ArdoSiteConfigProvider,
  findCurrentSidebarItem,
  getPrevNextLinks,
  useArdoConfig,
  useArdoContext,
  useArdoPageData,
  useArdoSidebar,
  useArdoSiteConfig,
  useArdoTOC,
} from "./runtime"
export type { ArdoSiteConfig } from "./runtime"

// UI Components (client-safe)
export {
  ArdoCodeBlock,
  ArdoCodeGroup,
  ArdoContainer,
  ArdoContent,
  ArdoCopyButton,
  ArdoDanger,
  ArdoDocLayout,
  ArdoDocPage,
  ArdoFeatureCard,
  ArdoFeatures,
  ArdoFooter,
  ArdoHeader,
  ArdoHero,
  ArdoHomePage,
  ArdoInfo,
  ArdoLayout,
  ArdoNote,
  ArdoSearch,
  ArdoSidebar,
  ArdoTab,
  ArdoTabList,
  ArdoTabPanel,
  ArdoTabPanels,
  ArdoTabs,
  ArdoThemeToggle,
  ArdoTip,
  ArdoTOC,
  ArdoWarning,
} from "./ui"
export type { ArdoHeroAction, ArdoHeroImage, ArdoHeroProps } from "./ui"
export type { ArdoFeatureCardProps, ArdoFeaturesProps } from "./ui"
export type { ArdoCodeBlockProps, ArdoCodeGroupProps } from "./ui"
export type {
  ArdoContainerProps,
  ArdoContainerType,
  ArdoDangerProps,
  ArdoInfoProps,
  ArdoNoteProps,
  ArdoTipProps,
  ArdoWarningProps,
} from "./ui"
export type {
  ArdoTabListProps,
  ArdoTabPanelProps,
  ArdoTabPanelsProps,
  ArdoTabProps,
  ArdoTabsProps,
} from "./ui"

// ===========================================================================
// Server-only exports are NOT re-exported from the main entry.
// They pull in heavy Node.js dependencies (Vite, Rolldown, TypeDoc, etc.)
// that break client-side bundling. Use the dedicated subpath exports instead:
//
//   import { ardo } from "ardo/vite"         — Vite plugin & build utilities
//   import { generateApiDocs } from "ardo/typedoc"  — TypeDoc integration
// ===========================================================================
