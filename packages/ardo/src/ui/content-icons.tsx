// Streamline Core Line icons for Ardo documentation content.
// Generated SVG components are shared with the built-in UI where possible.
// Icons © Streamline Design Inc., under the Streamline Premium License.
// See ICONS-LICENSE.md and ./icons/README.md.

import type { ComponentType, SVGProps } from "react"

import SvgArchive from "./icons/sections/Archive"
import SvgArrowRight from "./icons/chrome/PreviousNext"
import SvgBookmark from "./icons/sections/Reference"
import SvgBookOpen from "./icons/sections/Guide"
import SvgBranch from "./icons/content/Branch"
import SvgBug from "./icons/content/Bug"
import SvgCheck from "./icons/chrome/Copied"
import SvgClock from "./icons/chrome/LastUpdated"
import SvgCloud from "./icons/content/Cloud"
import SvgCode from "./icons/sections/Api"
import SvgCopy from "./icons/chrome/Copy"
import SvgDatabase from "./icons/content/Database"
import SvgDownload from "./icons/content/Download"
import SvgExternalLink from "./icons/chrome/ExternalLink"
import SvgFileCode from "./icons/content/FileCode"
import SvgFileText from "./icons/content/FileText"
import SvgFlag from "./icons/sections/GettingStarted"
import SvgFolder from "./icons/content/Folder"
import SvgGlobe from "./icons/content/Globe"
import SvgHelp from "./icons/content/Help"
import SvgHistory from "./icons/sections/Changelog"
import SvgImage from "./icons/content/Image"
import SvgInfo from "./icons/chrome/Info"
import SvgLanguages from "./icons/chrome/Language"
import SvgLayers from "./icons/sections/Architecture"
import SvgLayoutGrid from "./icons/sections/Components"
import SvgLightbulb from "./icons/sections/Concepts"
import SvgLink from "./icons/chrome/HeadingLink"
import SvgList from "./icons/content/List"
import SvgListChecks from "./icons/sections/HowTo"
import SvgLock from "./icons/sections/Security"
import SvgMessageCircle from "./icons/content/MessageCircle"
import SvgPackage from "./icons/content/Package"
import SvgPencil from "./icons/chrome/Edit"
import SvgPlug from "./icons/sections/Integrations"
import SvgRocket from "./icons/content/Rocket"
import SvgSearch from "./icons/chrome/Search"
import SvgServer from "./icons/content/Server"
import SvgSettings from "./icons/content/Settings"
import SvgShieldCheck from "./icons/sections/Quality"
import SvgTable from "./icons/content/Table"
import SvgTerminal from "./icons/sections/Cli"
import SvgTestTube from "./icons/content/TestTube"
import SvgTriangleAlert from "./icons/chrome/Warning"
import SvgUpload from "./icons/content/Upload"
import SvgUser from "./icons/content/User"
import SvgUsers from "./icons/content/Users"
import SvgWorkflow from "./icons/content/Workflow"
import SvgWrench from "./icons/sections/Operations"
import SvgZap from "./icons/content/Zap"

export type CoreIconProps = {
  size?: number | string
} & Omit<SVGProps<SVGSVGElement>, "children">

type CoreIconSvgProps = CoreIconProps & {
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

function CoreIconSvg({ icon: Svg, size = 24, ...props }: CoreIconSvgProps) {
  const labeled = props["aria-label"] != null || props["aria-labelledby"] != null
  return (
    <Svg
      width={size}
      height={size}
      role={labeled ? "img" : undefined}
      aria-hidden={labeled ? undefined : true}
      {...props}
    />
  )
}

export function Archive(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgArchive} {...props} />
}

export function ArrowRight(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgArrowRight} {...props} />
}

export function Bookmark(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgBookmark} {...props} />
}

export function BookOpen(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgBookOpen} {...props} />
}

export function Branch(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgBranch} {...props} />
}

export function Bug(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgBug} {...props} />
}

export function Check(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgCheck} {...props} />
}

export function Clock(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgClock} {...props} />
}

export function Cloud(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgCloud} {...props} />
}

export function Code(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgCode} {...props} />
}

export function Copy(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgCopy} {...props} />
}

export function Database(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgDatabase} {...props} />
}

export function Download(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgDownload} {...props} />
}

export function ExternalLink(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgExternalLink} {...props} />
}

export function FileCode(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgFileCode} {...props} />
}

export function FileText(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgFileText} {...props} />
}

export function Flag(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgFlag} {...props} />
}

export function Folder(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgFolder} {...props} />
}

export function Globe(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgGlobe} {...props} />
}

export function Help(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgHelp} {...props} />
}

export function History(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgHistory} {...props} />
}

export function Image(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgImage} {...props} />
}

export function Info(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgInfo} {...props} />
}

export function Languages(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgLanguages} {...props} />
}

export function Layers(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgLayers} {...props} />
}

export function LayoutGrid(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgLayoutGrid} {...props} />
}

export function Lightbulb(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgLightbulb} {...props} />
}

export function Link(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgLink} {...props} />
}

export function List(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgList} {...props} />
}

export function ListChecks(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgListChecks} {...props} />
}

export function Lock(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgLock} {...props} />
}

export function MessageCircle(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgMessageCircle} {...props} />
}

export function Package(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgPackage} {...props} />
}

export function Pencil(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgPencil} {...props} />
}

export function Plug(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgPlug} {...props} />
}

export function Rocket(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgRocket} {...props} />
}

export function Search(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgSearch} {...props} />
}

export function Server(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgServer} {...props} />
}

export function Settings(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgSettings} {...props} />
}

export function ShieldCheck(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgShieldCheck} {...props} />
}

export function Table(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgTable} {...props} />
}

export function Terminal(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgTerminal} {...props} />
}

export function TestTube(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgTestTube} {...props} />
}

export function TriangleAlert(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgTriangleAlert} {...props} />
}

export function Upload(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgUpload} {...props} />
}

export function User(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgUser} {...props} />
}

export function Users(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgUsers} {...props} />
}

export function Workflow(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgWorkflow} {...props} />
}

export function Wrench(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgWrench} {...props} />
}

export function Zap(props: CoreIconProps) {
  return <CoreIconSvg icon={SvgZap} {...props} />
}
