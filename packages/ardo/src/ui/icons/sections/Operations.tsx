import type { SVGProps } from "react"

const SvgOperations = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.41 3.596a.76.76 0 0 0-.35-.51l-2 2a1 1 0 0 1-1.44 0l-.76-.68a1 1 0 0 1 0-1.4l2-2a.76.76 0 0 0-.48-.43A3.8 3.8 0 0 0 6.18 5.885L.815 11.252a1 1 0 0 0 .014 1.428l.56.538a1 1 0 0 0 1.397-.01l5.428-5.37a3.81 3.81 0 0 0 5.196-4.242"
    />
  </svg>
)
export default SvgOperations
