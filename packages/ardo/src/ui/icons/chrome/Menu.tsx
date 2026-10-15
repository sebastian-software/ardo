import type { SVGProps } from "react"

const SvgMenu = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 2H.5M13.5 7H.5M13.5 12H.5" />
    </g>
  </svg>
)
export default SvgMenu
