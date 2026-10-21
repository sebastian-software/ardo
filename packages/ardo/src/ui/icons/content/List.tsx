import type { SVGProps } from "react"

const SvgList = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 2a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1M5 1.5h8M1.5 7.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1M5 7h8M1.5 13a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1M5 12.5h8" />
    </g>
  </svg>
)
export default SvgList
