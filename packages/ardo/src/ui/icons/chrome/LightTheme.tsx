import type { SVGProps } from "react"

const SvgLightTheme = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 8.998a1.998 1.998 0 1 0 0-3.996 1.998 1.998 0 0 0 0 3.996M7 .5v1M7 12.5v1M13.5 7h-1M1.5 7h-1M11.6 2.4l-.71.71M3.11 10.89l-.71.71M11.6 11.6l-.71-.71M3.11 3.11 2.4 2.4" />
    </g>
  </svg>
)
export default SvgLightTheme
