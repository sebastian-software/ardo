import type { SVGProps } from "react"

const SvgProposals = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.5 10.12h.5l1.5.38-1-3v-6a1 1 0 0 0-1-1h-8a1 1 0 0 0-1 1V3" />
      <path d="m4 12.5-3.5 1 .5-3v-4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1zM3.5 8h3M3.5 10h2" />
    </g>
  </svg>
)
export default SvgProposals
