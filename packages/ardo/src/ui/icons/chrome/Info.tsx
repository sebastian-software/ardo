import type { SVGProps } from "react"

const SvgInfo = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 13.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13M5.5 10h3" />
      <path d="M7 10V6.5H6M7 4.25a.25.25 0 0 1 0-.5M7 4.25a.25.25 0 0 0 0-.5" />
    </g>
  </svg>
)
export default SvgInfo
