import type { SVGProps } from "react"

const SvgClose = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12.5 1.5-11 11M1.5 1.5l11 11" />
    </g>
  </svg>
)
export default SvgClose
