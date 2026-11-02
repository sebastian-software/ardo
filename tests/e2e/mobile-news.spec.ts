import { expect, test, type Locator } from "@playwright/test"

async function expectLocaleFits(menu: Locator) {
  const select = menu.getByRole("combobox", { name: "Sprache", exact: true })
  await expect(select).toHaveValue("de")
  const metrics = await select.evaluate((element: HTMLSelectElement) => {
    const style = getComputedStyle(element)
    const context = document.createElement("canvas").getContext("2d")!
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    return {
      available:
        element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
      text: context.measureText(element.selectedOptions[0].text).width,
      fontSize: parseFloat(style.fontSize),
    }
  })
  expect(metrics.available).toBeGreaterThanOrEqual(metrics.text)
  expect(metrics.fontSize).toBeGreaterThanOrEqual(14)
}

test("mobile news offers recent localized articles, the current article, and the complete archive", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/de/news/ardo-6-1/")
  await page.getByRole("button", { name: "Menü umschalten", exact: true }).click()
  const menu = page.getByRole("dialog")
  await expectLocaleFits(menu)
  const recent = menu.getByRole("navigation", { name: "Neueste Artikel", exact: true })
  await expect(recent.getByRole("listitem")).toHaveCount(2)
  const latest = recent.getByRole("link", { name: "Ardo 6.1: Platz für Neuigkeiten", exact: true })
  await expect(latest).toHaveAttribute("aria-current", "page")
  await expect(latest).toHaveAttribute("href", "/de/news/ardo-6-1/")
  await expect(recent.getByRole("link", { name: /Ardo 6: React-Dokumentation/ })).toHaveAttribute(
    "href",
    "/de/news/ardo-6/"
  )
  await recent.getByRole("link", { name: "Alle Artikel", exact: true }).click()
  await expect(page).toHaveURL(/\/de\/news\/$/)
  await expect(page.locator(".ardo-post-list h2")).toHaveCount(2)
  await expect(menu).toBeHidden()
  await page.getByRole("button", { name: "Menü umschalten", exact: true }).click()
  await expect(menu.getByRole("link", { name: "Alle Artikel", exact: true })).toHaveAttribute(
    "aria-current",
    "page"
  )
})

test("a narrow homepage menu has one separator before settings and a readable language select", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.goto("/de/")
  await page.getByRole("button", { name: "Menü umschalten", exact: true }).click()
  const menu = page.getByRole("dialog")
  await expectLocaleFits(menu)
  await expect(menu.locator(".ardo-mobile-panel-content")).toHaveCount(0)
  const width = await menu.evaluate((element) => ({
    visible: element.clientWidth,
    content: element.scrollWidth,
  }))
  expect(width.content).toBeLessThanOrEqual(width.visible)
  expect(
    await menu
      .locator(".ardo-nav")
      .evaluate((element) => getComputedStyle(element.parentElement!).borderBottomWidth)
  ).toBe("0px")
  await expect(menu.locator(".ardo-mobile-panel-settings")).toHaveCSS("border-top-width", "1px")
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
})
