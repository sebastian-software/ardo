import type { SVGProps } from "react"

const SvgHelp = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 13.5a.5.5 0 0 1 0-1M7 13.5a.5.5 0 0 0 0-1M3.5 4A3.5 3.5 0 1 1 7 7.5v3" />
    </g>
  </svg>
)
export default SvgHelp
