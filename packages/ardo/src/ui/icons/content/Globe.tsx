import type { SVGProps } from "react"

const SvgGlobe = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M1 6.999h12M7 1.002a6 6 0 1 1 0 12 6 6 0 0 1 0-12M7 1a10.36 10.36 0 0 0-2.308 6 10.36 10.36 0 0 0 2.308 6 10.36 10.36 0 0 0 2.308-6A10.36 10.36 0 0 0 7 .999"
    />
  </svg>
)
export default SvgGlobe
