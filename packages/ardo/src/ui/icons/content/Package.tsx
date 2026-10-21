import type { SVGProps } from "react"

const SvgPackage = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 1v3.692M8.385 10.442h2M1 4.692h12v7.385a.923.923 0 0 1-.923.923H1.923A.923.923 0 0 1 1 12.077z" />
      <path d="M2.479 1.572A1 1 0 0 1 3.383 1h7.234a1 1 0 0 1 .904.572L13 4.692H1z" />
    </g>
  </svg>
)
export default SvgPackage
