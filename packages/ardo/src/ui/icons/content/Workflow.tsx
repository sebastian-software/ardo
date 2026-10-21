import type { SVGProps } from "react"

const SvgWorkflow = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.75.75a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5M11.75 10a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5M.75 12.5V11a1 1 0 0 1 1-1h1.5a1 1 0 0 1 1 1v1.5a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1M4.5 2.5l-2-2-2 2 2 2zM7.5 10.25l1.5 1.5-1.5 1.5M7 1 5.5 2.5 7 4M1 7.5 2.5 9 4 7.5M2.5 9V4.5M5.5 2.5H10M4.25 11.75H9" />
    </g>
  </svg>
)
export default SvgWorkflow
