import type { SVGProps } from "react"

const SvgExternalLink = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.5 6.5v6.077c0 .51-.413.923-.923.923H1.423a.923.923 0 0 1-.923-.923V2.423c0-.51.413-.923.923-.923H7.5M.5 4h6M10 .5h3.5V4M13.5.5l-5 5" />
    </g>
  </svg>
)
export default SvgExternalLink
