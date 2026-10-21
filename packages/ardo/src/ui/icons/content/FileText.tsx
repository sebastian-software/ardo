import type { SVGProps } from "react"

const SvgFileText = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.5 12.5a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1H9L12.5 4zM4.5 4.5h2M4.5 7.5h5M4.5 10.5h5" />
    </g>
  </svg>
)
export default SvgFileText
