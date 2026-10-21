import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ArdoIcon, getRegisteredIconNames, registerIcons } from "../ui/components/Icon"
import * as core from "../ui/content-icons"
import { Code, Github, MessageCircle, Rocket } from "./index"

function CustomCode({ size }: { size?: number }) {
  return <svg data-custom-icon="code" width={size} height={size} />
}

describe("content icons", () => {
  it("makes all 50 Core icons available by name without registration", () => {
    expect(Object.keys(core)).toHaveLength(50)
    expect(getRegisteredIconNames()).toStrictEqual(expect.arrayContaining(Object.keys(core)))
    for (const name of Object.keys(core)) {
      const html = renderToStaticMarkup(<ArdoIcon name={name} size={20} />)
      expect(html).toContain('viewBox="0 0 14 14"')
      expect(html).toContain('width="20" height="20"')
    }
  })

  it("renders the Core catalog as decorative, color-inheriting SVGs", () => {
    for (const Icon of Object.values(core)) {
      const html = renderToStaticMarkup(<Icon size={20} className="content-icon" />)
      expect(html).toContain('viewBox="0 0 14 14"')
      expect(html).toContain('width="20" height="20"')
      expect(html).toContain('class="content-icon"')
      expect(html).toContain('aria-hidden="true"')
      expect(html).toContain('stroke="currentColor"')
      expect(html).not.toMatch(/\bid="/)
    }
  })

  it("supports accessible labels and native SVG dimensions", () => {
    const labeled = renderToStaticMarkup(<MessageCircle size="1em" aria-label="Discussion" />)
    expect(labeled).toContain('width="1em" height="1em"')
    expect(labeled).toContain('role="img"')
    expect(labeled).toContain('aria-label="Discussion"')
    expect(labeled).not.toContain('aria-hidden="true"')

    const linked = renderToStaticMarkup(<Rocket aria-labelledby="launch-label" width={32} />)
    expect(linked).toContain('width="32" height="24"')
    expect(linked).toContain('role="img"')
    expect(linked).not.toContain('aria-hidden="true"')
  })

  it("allows custom icons to extend the registry and override built-in names", () => {
    registerIcons({ CustomCode, Code: CustomCode })
    try {
      const custom = renderToStaticMarkup(<ArdoIcon name="CustomCode" size={28} />)
      const overridden = renderToStaticMarkup(<ArdoIcon name="Code" size={28} />)
      expect(custom).toContain('data-custom-icon="code"')
      expect(overridden).toContain('data-custom-icon="code"')
      expect(overridden).toContain('width="28" height="28"')
      expect(renderToStaticMarkup(<ArdoIcon name="Rocket" />)).toContain('viewBox="0 0 14 14"')
    } finally {
      registerIcons({ Code })
    }
  })

  it("keeps brand exports available", () => {
    expect(renderToStaticMarkup(<Github size={16} />)).toContain('viewBox="0 0 24 24"')
  })
})
