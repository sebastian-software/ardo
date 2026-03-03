// Config (client-safe: pure types and small utility functions)
export { defineConfig, resolveConfig, loadConfig } from "./config"
export type {
  ArdoConfig,
  ResolvedConfig,
  ThemeConfig,
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
  useArdoContext,
  useConfig,
  useThemeConfig,
  useSidebar,
  usePageData,
  useTOC,
  findCurrentSidebarItem,
  getPrevNextLinks,
} from "./runtime"

// UI Components (client-safe)
export {
  Layout,
  Header,
  Sidebar,
  TOC,
  Content,
  Footer,
  DocPage,
  DocLayout,
  HomePage,
  ThemeToggle,
  Search,
  CodeBlock,
  CodeGroup,
  Container,
  Tip,
  Warning,
  Danger,
  Info,
  Note,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  TabPanels,
  CopyButton,
  Hero,
  Features,
  FeatureCard,
  Steps,
  FileTree,
} from "./ui"
export type { HeroProps, HeroAction, HeroImage } from "./ui"
export type { FeaturesProps, FeatureCardProps, FeatureItem } from "./ui"
export type { CodeBlockProps, CodeGroupProps } from "./ui"
export type {
  ContainerProps,
  ContainerType,
  TipProps,
  WarningProps,
  DangerProps,
  InfoProps,
  NoteProps,
} from "./ui"
export type { TabsProps, TabListProps, TabProps, TabPanelProps, TabPanelsProps } from "./ui"
export type { StepsProps } from "./ui"
export type { FileTreeProps } from "./ui"

// ===========================================================================
// Server-only exports are NOT re-exported from the main entry.
// They pull in heavy Node.js dependencies (Vite, Rolldown, TypeDoc, etc.)
// that break client-side bundling. Use the dedicated subpath exports instead:
//
//   import { ardo } from "ardo/vite"         — Vite plugin & build utilities
//   import { generateApiDocs } from "ardo/typedoc"  — TypeDoc integration
// ===========================================================================
