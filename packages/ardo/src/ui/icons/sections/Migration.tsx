import type { SVGProps } from "react"

const SvgMigration = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 14 14" {...props}>
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.639 5.565c0 .24-.195.435-.435.435h-4.77A.435.435 0 0 1 1 5.565v-4.13A.435.435 0 0 1 1.435 1h1.854a.435.435 0 0 1 .435.33l.122.79h2.358a.435.435 0 0 1 .435.434zM13.014 12.565c0 .24-.195.435-.435.435H7.81a.435.435 0 0 1-.434-.435v-4.13A.435.435 0 0 1 7.81 8h1.854a.435.435 0 0 1 .435.33l.122.79h2.358a.435.435 0 0 1 .435.434zM13 5.5v-1a2 2 0 0 0-2-2H8.5" />
      <path d="M10 1 8.5 2.5 10 4M1 8.5v1a2 2 0 0 0 2 2h2.5" />
      <path d="m4 10 1.5 1.5L4 13" />
    </g>
  </svg>
)
export default SvgMigration
