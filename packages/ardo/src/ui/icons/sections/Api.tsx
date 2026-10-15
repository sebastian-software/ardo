import type { SVGProps } from "react"

const SvgApi = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.61.5h-.386a1 1 0 0 0-1 1v3.045A2 2 0 0 1 2.98 6.397L1.5 7l1.48.603a2 2 0 0 1 1.244 1.852V12.5a1 1 0 0 0 1 1h.386M8.39.5h.386a1 1 0 0 1 1 1v3.045a2 2 0 0 0 1.245 1.852L12.5 7l-1.48.603a2 2 0 0 0-1.244 1.852V12.5a1 1 0 0 1-1 1H8.39" />
    </g>
  </svg>
)
export default SvgApi
