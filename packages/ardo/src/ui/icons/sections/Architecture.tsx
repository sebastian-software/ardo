import type { SVGProps } from "react"

const SvgArchitecture = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.5 1.5h-8a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1" />
      <path d="M9.5 12.5h-8a1 1 0 0 1-1-1v-6" />
    </g>
  </svg>
)
export default SvgArchitecture
