import type { SVGProps } from "react"

const SvgGuide = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.002 1.064C8.667 1.5 7 4 7 4v9s1.667-2.5 5.002-2.936C12.549 9.993 13 9.552 13 9V2c0-.552-.45-1.007-.998-.936M1.998 1.064C5.333 1.5 7 4 7 4v9s-1.667-2.5-5.002-2.936C1.451 9.993 1 9.552 1 9V2c0-.552.45-1.007.998-.936" />
    </g>
  </svg>
)
export default SvgGuide
