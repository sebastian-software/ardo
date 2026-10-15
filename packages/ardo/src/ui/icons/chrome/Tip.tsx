import type { SVGProps } from "react"

const SvgTip = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13.5h4M9 9.032a4.5 4.5 0 1 0-4 0V10.5a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5z" />
      <path d="m7.25 2.75-1.5 2.5h2.5l-1.5 2.5" />
    </g>
  </svg>
)
export default SvgTip
