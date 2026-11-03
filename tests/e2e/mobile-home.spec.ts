import { expect, test } from "@playwright/test"

for (const width of [320, 390, 430, 760, 768, 769, 1024, 1280]) {
  test(`homepage sections stay separated at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto("/en/")
    const card = page.getByRole("heading", { name: "Serve it", exact: true }).locator("..")
    const label = page.getByText("the easy way in", { exact: true })
    const cardBounds = (await card.boundingBox())!
    const labelBounds = (await label.boundingBox())!
    expect(labelBounds.y - (cardBounds.y + cardBounds.height)).toBeGreaterThanOrEqual(96)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
  })
}

for (const locale of ["de", "fr", "es"]) {
  test(`localized homepage keeps section spacing in ${locale}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/${locale}/`)
    const spacing = await page.locator("#setup").evaluate((element) => {
      const previous = element.previousElementSibling!
      const headings = previous.querySelectorAll("h3")
      const card = headings[headings.length - 1].parentElement!
      const label = element.querySelector("p")!
      return label.getBoundingClientRect().top - card.getBoundingClientRect().bottom
    })
    expect(spacing).toBeGreaterThanOrEqual(96)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
  })
}
