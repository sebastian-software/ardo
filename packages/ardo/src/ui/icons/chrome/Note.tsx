import type { SVGProps } from "react"

const SvgNote = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 13H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6.5z" />
      <path d="M8.5 9v4L13 8.5H9a.5.5 0 0 0-.5.5" />
    </g>
  </svg>
)
export default SvgNote
