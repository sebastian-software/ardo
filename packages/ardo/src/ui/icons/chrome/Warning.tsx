import type { SVGProps } from "react"

const SvgWarning = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.136 1.98.877 10.997a1 1 0 0 0 .864 1.504h10.518a1 1 0 0 0 .864-1.504l-5.26-9.015a1 1 0 0 0-1.727 0M7 5v3.25" />
      <path d="M7 10.5a.25.25 0 1 1 0-.5M7 10.5a.25.25 0 1 0 0-.5" />
    </g>
  </svg>
)
export default SvgWarning
