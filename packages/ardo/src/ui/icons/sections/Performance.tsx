import type { SVGProps } from "react"

const SvgPerformance = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 13.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13M10 4.5l-3 5M1 9.5h12" />
    </g>
  </svg>
)
export default SvgPerformance
