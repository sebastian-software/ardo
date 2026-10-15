import type { SVGProps } from "react"

const SvgChangelog = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3.5V7h2.5" />
      <path d="M9.5 13.002A6.502 6.502 0 0 0 7 .5a6.5 6.5 0 0 0-1.5 12.826" />
      <path d="M12 13.5H9.5V11" />
    </g>
  </svg>
)
export default SvgChangelog
