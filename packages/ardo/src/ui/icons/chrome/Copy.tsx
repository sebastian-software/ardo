import type { SVGProps } from "react"

const SvgCopy = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 12V4.5a1 1 0 0 0-1-1H4.5a1 1 0 0 0-1 1V12a1 1 0 0 0 1 1H12a1 1 0 0 0 1-1" />
      <path d="M1 9.5V2a1 1 0 0 1 1-1h7.5M5.75 8.25h5M8.25 5.75v5" />
    </g>
  </svg>
)
export default SvgCopy
