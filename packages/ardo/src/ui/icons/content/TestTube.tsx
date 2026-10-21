import type { SVGProps } from "react"

const SvgTestTube = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5.5h9M4 3.5h2M4 6.5h2M4 9.5h2M10 .5v10a3 3 0 0 1-6 0V.5" />
    </g>
  </svg>
)
export default SvgTestTube
