import type { SVGProps } from "react"

const SvgCloud = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 6.5a2.5 2.5 0 0 0-1.5.5A4.5 4.5 0 1 0 5 11.5h6a2.5 2.5 0 0 0 0-5"
    />
  </svg>
)
export default SvgCloud
