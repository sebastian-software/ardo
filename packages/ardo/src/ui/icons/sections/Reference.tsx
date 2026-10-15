import type { SVGProps } from "react"

const SvgReference = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 1.5v12L7 10l5 3.5v-12a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1" />
      <path d="M2 9.5 7 6l5 3.5" />
    </g>
  </svg>
)
export default SvgReference
