// Config
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

// Vite Plugin
export { ardoPlugin } from "./vite"
export type { ArdoPluginOptions } from "./vite"

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

// Build-time utilities (re-exported from ./vite for convenience)
export {
  loadDoc,
  loadAllDocs,
  getSlugFromPath,
  getPageDataForRoute,
  generateSidebar,
  transformMarkdown,
  transformMarkdownToReact,
} from "./vite"

// UI Components
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

// TypeDoc
export {
  TypeDocGenerator,
  generateApiDocs,
  typedocPlugin,
  createTypedocWatcher,
  ApiSignature,
  ApiParametersTable,
  ApiReturns,
  ApiItem,
  ApiKindBadge,
  ApiHierarchy,
} from "./typedoc"
export type {
  TypeDocPluginOptions,
  ApiDocItem,
  ApiDocKind,
  ApiDocParameter,
  ApiDocReturn,
  ApiDocTag,
  ApiDocSource,
  ApiDocTypeParameter,
  ApiDocHierarchy,
  GeneratedApiDoc,
} from "./typedoc"
