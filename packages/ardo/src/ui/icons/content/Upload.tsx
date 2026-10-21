import type { SVGProps } from "react"

const SvgUpload = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 6 7 3.5 9.5 6M7 3.5v7" />
      <path d="M7 13.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13" />
    </g>
  </svg>
)
export default SvgUpload
