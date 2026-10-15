import type { SVGProps } from "react"

const SvgHowTo = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 12h5M8 2h5M8 5.333h5M8 8.667h5M6 1 2.667 5 1 3.8M6 9l-3.333 4L1 11.8" />
    </g>
  </svg>
)
export default SvgHowTo
