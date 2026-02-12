interface IconProps {
  size?: number
  className?: string
}

function icon(name: string, { size = 24, className }: IconProps = {}) {
  return (
    <span
      className={
        className ? `ardo-icon ardo-icon-${name} ${className}` : `ardo-icon ardo-icon-${name}`
      }
      role="img"
      style={{ width: size, height: size }}
    />
  )
}

export function GithubIcon(props: IconProps) {
  return icon("github", props)
}
export function TwitterIcon(props: IconProps) {
  return icon("twitter", props)
}
export function MessageCircleIcon(props: IconProps) {
  return icon("message-circle", props)
}
export function LinkedinIcon(props: IconProps) {
  return icon("linkedin", props)
}
export function YoutubeIcon(props: IconProps) {
  return icon("youtube", props)
}
export function PackageIcon(props: IconProps) {
  return icon("package", props)
}
export function SunIcon(props: IconProps) {
  return icon("sun", props)
}
export function MoonIcon(props: IconProps) {
  return icon("moon", props)
}
export function MonitorIcon(props: IconProps) {
  return icon("monitor", props)
}
export function LightbulbIcon(props: IconProps) {
  return icon("lightbulb", props)
}
export function AlertTriangleIcon(props: IconProps) {
  return icon("alert-triangle", props)
}
export function XCircleIcon(props: IconProps) {
  return icon("x-circle", props)
}
export function InfoIcon(props: IconProps) {
  return icon("info", props)
}
export function FileTextIcon(props: IconProps) {
  return icon("file-text", props)
}
export function CopyIcon(props: IconProps) {
  return icon("copy", props)
}
export function CheckIcon(props: IconProps) {
  return icon("check", props)
}
export function ChevronDownIcon(props: IconProps) {
  return icon("chevron-down", props)
}
export function SearchIcon(props: IconProps) {
  return icon("search", props)
}
