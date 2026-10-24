// Config (client-safe: pure types and small utility functions)
export { resolveConfig } from "./config"
export type {
  ArdoConfig,
  ContentValidationConfig,
  DiagnosticLevel,
  FrontmatterValidationConfig,
  HeadConfig,
  LlmsConfig,
  MarkdownConfig,
  OpenApiConfig,
  PageData,
  PageFrontmatter,
  ProjectMeta,
  ResolvedConfig,
  SidebarConfig,
  SidebarItem,
  SocialLink,
  TOCItem,
} from "./config"

// Runtime (React hooks and context - client-safe)
export {
  ArdoActiveLink,
  ArdoHead,
  ArdoLink,
  ArdoOutlet,
  ArdoPageProvider,
  ArdoProvider,
  ArdoScripts,
  ArdoSiteConfigProvider,
  findCurrentSidebarItem,
  getPrevNextLinks,
  useArdoConfig,
  useArdoContext,
  useArdoHref,
  useArdoLabels,
  useArdoPage,
  useArdoPageData,
  useArdoPath,
  useArdoSidebar,
  useArdoSiteConfig,
  useArdoTOC,
} from "./runtime"
export type {
  ArdoLinkProps,
  ArdoMetaDescriptor,
  ArdoMetaFunction,
  ArdoPage,
  ArdoSiteConfig,
} from "./runtime"

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
  ArdoSteps,
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
export type { ArdoStepsProps } from "./ui"
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
// They pull in heavy Node.js dependencies (Vite, Rolldown, native compiler, etc.)
// that break client-side bundling. Use the dedicated subpath exports instead:
//
//   import { ardo } from "ardo/vite"         — Vite plugin & build utilities
//   import { generateNativeDocs } from "ardo/api"  — native API documentation
// ===========================================================================
