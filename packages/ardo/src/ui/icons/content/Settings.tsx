import type { SVGProps } from "react"

const SvgSettings = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 .5V2M7 12v1.5M13.5 7H12M2 7H.5M2.404 2.404l1.06 1.06M10.536 10.536l1.06 1.06M11.596 2.404l-1.06 1.06M3.464 10.536l-1.06 1.06M2 7a5 5 0 1 0 10 0A5 5 0 1 0 2 7M7 7h5M4.5 2.67 7 7M4.5 11.33 7 7" />
    </g>
  </svg>
)
export default SvgSettings
