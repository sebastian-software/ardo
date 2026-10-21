import type { SVGProps } from "react"

const SvgFolder = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M1 12V2a1 1 0 0 1 1-1h2.72a1 1 0 0 1 .97.757L6 3h6a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1"
    />
  </svg>
)
export default SvgFolder
