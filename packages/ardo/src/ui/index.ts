// Layout components
export { ArdoLayout, ArdoRootLayout } from "./Layout"
export type { ArdoLayoutProps, ArdoRootLayoutProps } from "./Layout"

export { ArdoRoot } from "./ArdoRoot"
export type { ArdoRootProps } from "./ArdoRoot"

export { ArdoHeader, ArdoSocialLink } from "./Header"
export type { ArdoHeaderProps, ArdoSocialLinkProps } from "./Header"

export { ArdoSidebar, ArdoSidebarGroup, ArdoSidebarLink } from "./Sidebar"
export type { ArdoSidebarProps, ArdoSidebarGroupProps, ArdoSidebarLinkProps } from "./Sidebar"

export { ArdoFooter } from "./Footer"
export type { ArdoFooterProps, ArdoFooterMessageProps, ArdoFooterCopyrightProps } from "./Footer"

export { ArdoNav, ArdoNavLink } from "./Nav"
export type { ArdoNavProps, ArdoNavLinkProps } from "./Nav"

export { ArdoTOC } from "./TOC"
export { ArdoContent } from "./Content"
export { ArdoBareContent } from "./BareContent"
export { ArdoDocPage, ArdoDocContent, ArdoDocLayout } from "./DocPage"
export { ArdoHomePage } from "./HomePage"

// UI components
export {
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
  ArdoIcon,
  registerIcons,
  getRegisteredIconNames,
} from "./components"
export type { ArdoIconProps } from "./components"
export type { ArdoHeroProps, ArdoHeroAction, ArdoHeroImage } from "./components"
export type { ArdoFeaturesProps, ArdoFeatureCardProps, ArdoFeatureItem } from "./components"
export type { ArdoCodeBlockProps, ArdoCodeGroupProps } from "./components"
export type {
  ArdoContainerProps,
  ArdoContainerType,
  ArdoTipProps,
  ArdoWarningProps,
  ArdoDangerProps,
  ArdoInfoProps,
  ArdoNoteProps,
} from "./components"
export type {
  ArdoTabsProps,
  ArdoTabListProps,
  ArdoTabProps,
  ArdoTabPanelProps,
  ArdoTabPanelsProps,
} from "./components"
