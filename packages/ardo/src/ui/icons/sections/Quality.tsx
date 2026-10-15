import type { SVGProps } from "react"

const SvgQuality = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1H2a1 1 0 0 0-1 1v2.675A8.775 8.775 0 0 0 7 13a8.775 8.775 0 0 0 6-8.325V2a1 1 0 0 0-1-1" />
      <path d="M10 4 6 8.5 4 7" />
    </g>
  </svg>
)
export default SvgQuality
