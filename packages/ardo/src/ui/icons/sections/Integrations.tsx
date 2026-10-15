import type { SVGProps } from "react"

const SvgIntegrations = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinejoin="round">
      <path strokeLinecap="round" d="M8.55 4.621 10.671 2.5M11.379 7.45 13.5 5.328" />
      <path d="M7.136 3.914a.5.5 0 0 1 .707 0l4.243 4.243a.5.5 0 0 1 0 .707l-1.06 1.06a3.5 3.5 0 0 1-4.95-4.949z" />
      <path
        strokeLinecap="round"
        d="m6 10-.328.328A4 4 0 0 1 2.843 11.5H2.65a4 4 0 0 1-1.265-.205L.5 11"
      />
    </g>
  </svg>
)
export default SvgIntegrations
