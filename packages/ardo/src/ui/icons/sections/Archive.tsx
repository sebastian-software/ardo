import type { SVGProps } from "react"

const SvgArchive = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 1.5H1a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5h12a.5.5 0 0 0 .5-.5V2a.5.5 0 0 0-.5-.5M1.5 11.5v-7h11v7a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1M5.5 7.5h3" />
    </g>
  </svg>
)
export default SvgArchive
