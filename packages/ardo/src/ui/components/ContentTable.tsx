import type { TableHTMLAttributes } from "react"

import { tableScroll } from "../content.css"

/** Markdown table in a scroll box, so wide tables scroll without breaking table layout. */
export function ArdoContentTable(props: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className={tableScroll}>
      <table {...props} />
    </div>
  )
}
