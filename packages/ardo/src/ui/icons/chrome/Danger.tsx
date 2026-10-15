import type { SVGProps } from "react"

const SvgDanger = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinejoin="round">
      <path d="M.784 7.685a.97.97 0 0 1 0-1.37L6.314.784a.97.97 0 0 1 1.371 0l5.531 5.53a.97.97 0 0 1 0 1.371l-5.53 5.531a.97.97 0 0 1-1.371 0z" />
      <path strokeLinecap="round" d="M7 4v3.25" />
      <g strokeLinecap="round">
        <path d="M7 10a.25.25 0 0 1 0-.5M7 10a.25.25 0 0 0 0-.5" />
      </g>
    </g>
  </svg>
)
export default SvgDanger
