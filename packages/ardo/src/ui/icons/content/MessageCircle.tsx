import type { SVGProps } from "react"

const SvgMessageCircle = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.145 12.84a6.5 6.5 0 1 0-2.556-2.238m2.556 2.239L.5 13.5l1.089-2.897m2.556 2.238.005-.001m-2.561-2.237.001-.003"
    />
  </svg>
)
export default SvgMessageCircle
