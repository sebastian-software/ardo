import type { SVGProps } from "react"

const SvgSidebarToggle = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 1v12M4.5 3.5H3M4.5 6H3M1 12V2a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1" />
    </g>
  </svg>
)
export default SvgSidebarToggle
