import type { SVGProps } from "react"

const SvgHeadingLink = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 9 4-4M3.036 5.964l-1.5 1.5a3.536 3.536 0 0 0 5 5l1.5-1.5M10.964 8.036l1.5-1.5a3.536 3.536 0 0 0-5-5l-1.5 1.5" />
    </g>
  </svg>
)
export default SvgHeadingLink
