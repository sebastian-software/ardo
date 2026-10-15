import type { SVGProps } from "react"

const SvgChevron = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m.5 4 6.146 6.146a.5.5 0 0 0 .708 0L13.5 4"
    />
  </svg>
)
export default SvgChevron
