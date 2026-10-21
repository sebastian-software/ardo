import type { SVGProps } from "react"

const SvgImage = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8.573 4.605 5.97l5.963 5.963-.01.068" />
      <path d="M12 11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1z" />
      <path d="M8.625 6.375a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5" />
    </g>
  </svg>
)
export default SvgImage
