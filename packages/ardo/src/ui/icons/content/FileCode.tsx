import type { SVGProps } from "react"

const SvgFileCode = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.5 12.5a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1H9L12.5 4z" />
      <path d="m5.5 10.5-2-2 2-2M8.5 10.5l2-2-2-2" />
    </g>
  </svg>
)
export default SvgFileCode
