import type { SVGProps } from "react"

const SvgUser = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6M7 9a6.5 6.5 0 0 0-6.002 4h12.004A6.5 6.5 0 0 0 7 9" />
    </g>
  </svg>
)
export default SvgUser
