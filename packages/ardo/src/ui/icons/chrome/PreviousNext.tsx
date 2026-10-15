import type { SVGProps } from "react"

const SvgPreviousNext = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M.5 7h13M9.5 11l4-4-4-4" />
    </g>
  </svg>
)
export default SvgPreviousNext
