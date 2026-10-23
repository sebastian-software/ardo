import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ArdoPageDataProvider, ArdoProvider } from "../runtime/hooks"
import { ArdoPageProvider } from "../runtime/page"
import * as heroStyles from "./components/Hero.css"
import { ArdoHomePage } from "./HomePage"

function renderHome(image: { light: string; dark: string } | string) {
  return renderToStaticMarkup(
    <ArdoPageProvider>
      <ArdoProvider config={{ title: "Docs" }} sidebar={[]}>
        <ArdoPageDataProvider frontmatter={{ hero: { name: "Ardo", image } }} toc={[]}>
          <ArdoHomePage header={null} footer={null} />
        </ArdoPageDataProvider>
      </ArdoProvider>
    </ArdoPageProvider>
  )
}

describe("home page hero image", () => {
  it("renders the light and dark frontmatter images for their color schemes", () => {
    const html = renderHome({ light: "/hero-light.svg", dark: "/hero-dark.svg" })
    expect(html).toContain(
      `<img src="/hero-light.svg" alt="Ardo" class="${heroStyles.heroImageLight}"/>`
    )
    expect(html).toContain(
      `<img src="/hero-dark.svg" alt="Ardo" class="${heroStyles.heroImageDark}"/>`
    )
  })

  it("renders a single image without a scheme class", () => {
    const html = renderHome("/hero.svg")
    expect(html).toContain('<img src="/hero.svg" alt="Ardo"/>')
  })
})
