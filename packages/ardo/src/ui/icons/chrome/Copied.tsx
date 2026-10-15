import type { SVGProps } from "react"

const SvgCopied = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m.5 9 3.222 2.82a1 1 0 0 0 1.433-.12L13.5 1.5"
    />
  </svg>
)
export default SvgCopied
