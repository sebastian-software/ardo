import type { SVGProps } from "react"

const SvgDatabase = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 5.615c3.314 0 6-1.033 6-2.307S10.314 1 7 1 1 2.033 1 3.308s2.686 2.307 6 2.307" />
      <path d="M1 3.308v7.384C1 11.966 3.686 13 7 13s6-1.034 6-2.308V3.308" />
      <path d="M13 7c0 1.274-2.686 2.308-6 2.308S1 8.274 1 7" />
    </g>
  </svg>
)
export default SvgDatabase
