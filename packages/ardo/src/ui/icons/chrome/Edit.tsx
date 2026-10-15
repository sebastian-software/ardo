import type { SVGProps } from "react"

const SvgEdit = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m1.5 8.5-1 5 5-1 7.707-7.707a1 1 0 0 0 0-1.414L10.621.793a1 1 0 0 0-1.414 0z"
    />
  </svg>
)
export default SvgEdit
