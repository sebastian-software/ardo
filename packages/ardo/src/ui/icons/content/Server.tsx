import type { SVGProps } from "react"

const SvgServer = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinejoin="round">
      <path
        strokeLinecap="round"
        d="M4 4.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1M7 4h3.5M4 10.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1M7 10h3.5"
      />
      <path d="M1 4a3 3 0 0 1 3-3h6a3 3 0 1 1 0 6H4a3 3 0 0 1-3-3ZM1 10a3 3 0 0 1 3-3h6a3 3 0 1 1 0 6H4a3 3 0 0 1-3-3Z" />
    </g>
  </svg>
)
export default SvgServer
