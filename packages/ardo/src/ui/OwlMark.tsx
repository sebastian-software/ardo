import type { ComponentProps } from "react"

export type ArdoOwlMarkProps = {
  size?: number | string
  title?: string
} & Omit<ComponentProps<"svg">, "children">

/**
 * Decorative line-art owl, drawn in `currentColor`. Used by the default
 * error and empty states. Set `color` on the parent (or `style.color`)
 * to recolor; set `title` to give it accessible meaning.
 */
export function ArdoOwlMark({ size = 96, title, ...props }: ArdoOwlMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 600 600"
      width={size}
      height={size}
      style={{ strokeLinecap: "round", strokeLinejoin: "round" }}
      role={title == null ? "presentation" : "img"}
      aria-hidden={title == null ? true : undefined}
      {...props}
    >
      {title == null ? null : <title>{title}</title>}
      <defs>
        <symbol id="ardo-owl-eye" overflow="visible">
          <path d="M300 300 151 128l2 178-41 94h93c-35 32-55 68-63 107m63-106 95 81m-32-96 28 88" />
          <ellipse cx="222" cy="327" rx="20" ry="33" fill="currentColor" opacity="0.6" />
          <circle cx="227" cy="324" r="71" />
        </symbol>
      </defs>
      <g fill="none" stroke="currentColor" strokeWidth="16">
        <path d="M155 318c2-70 66-126 145-126s143 56 145 126" />
        <circle cx="300" cy="290" r="270" />
        <use href="#ardo-owl-eye" />
        <use href="#ardo-owl-eye" transform="matrix(-1 0 0 1 600 0)" />
      </g>
    </svg>
  )
}
