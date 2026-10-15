import type { SVGProps } from "react"

const SvgCli = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.077 1H1.923A.923.923 0 0 0 1 1.923v10.154c0 .51.413.923.923.923h10.154c.51 0 .923-.413.923-.923V1.923A.923.923 0 0 0 12.077 1M1 3.5h12" />
      <path d="m4.125 6.75 1.5 1.5-1.5 1.5M7.875 8.25h2" />
    </g>
  </svg>
)
export default SvgCli
