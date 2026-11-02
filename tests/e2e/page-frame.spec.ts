import { expect, test } from "@playwright/test"

const guide = "/v6/en/guide/getting-started/"

for (const width of [390, 1600]) {
  test(`marketing and docs share the centered frame at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const bounds = []
    for (const path of ["/en/", guide]) {
      await page.goto(path)
      const frame = page.locator('[data-ardo-frame="page"]')
      const header = page.locator(".ardo-header > div").first()
      const frameBox = (await frame.boundingBox())!
      const headerBox = (await header.boundingBox())!
      expect(frameBox.width).toBe(Math.min(width, 1152))
      expect(frameBox.x).toBe((width - frameBox.width) / 2)
      expect(headerBox.x).toBe(frameBox.x)
      expect(headerBox.width).toBe(frameBox.width)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
      bounds.push(frameBox.x)
    }
    expect(bounds[0]).toBe(bounds[1])
    await expect(page.locator(".ardo-page-rail")).toBeHidden()
    const outline = page.locator(".ardo-page-outline")
    await outline.locator("summary").press("Enter")
    await expect(outline.getByRole("link", { name: "Production Build", exact: true })).toBeVisible()
  })
}

test("a narrow theme frame collapses navigation on a wide viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto(guide)
  await page.addStyleTag({ content: ":root { --ardo-layout-pageMaxWidth: 54rem; }" })
  await expect(page.locator(".ardo-sidebar").first()).toBeHidden()
  const trigger = page.getByRole("button", { name: "Toggle menu", exact: true })
  await trigger.click()
  const menu = page.getByRole("dialog", { name: /Ardo navigation menu/ })
  await expect(menu.getByRole("link", { name: "Markdown & MDX", exact: true })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(trigger).toBeFocused()
  await page.keyboard.press("ControlOrMeta+k")
  const search = page.getByRole("dialog", { name: "Search", exact: true })
  await expect(search).toBeVisible()
  await expect(search.getByRole("combobox")).toBeFocused()
  const overlay = (await search.boundingBox())!
  expect(overlay).toEqual({ x: 0, y: 0, width: 1600, height: 900 })
  await page.keyboard.press("Escape")
  await expect(search).toBeHidden()
})

test("a wider theme and the full-width exception make room for the outline rail", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 900 })
  await page.goto(guide)
  const theme = await page.addStyleTag({ content: ":root { --ardo-layout-pageMaxWidth: 90rem; }" })
  await expect(page.locator(".ardo-page-rail")).toBeVisible()
  await expect(page.locator(".ardo-page-outline")).toBeHidden()
  expect((await page.locator("[data-ardo-frame]").boundingBox())!.width).toBe(1488)
  await theme.evaluate((element) => element.remove())
  // The prop and route-handle tests cover selecting this state; check its CSS geometry here.
  await page.locator("[data-ardo-frame]").evaluate((element) => {
    element.setAttribute("data-ardo-frame", "viewport")
  })
  expect((await page.locator("[data-ardo-frame]").boundingBox())!.width).toBe(1920)
  expect((await page.locator(".ardo-header > div").first().boundingBox())!.width).toBe(1920)
  await expect(page.locator(".ardo-page-rail")).toBeVisible()
  await expect(page.locator(".ardo-page-outline")).toBeHidden()
})

test("the bare-page header remains fixed while the document scrolls", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto("/en/")
  await page.evaluate(() => window.scrollTo(0, 600))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  expect((await page.locator(".ardo-header").boundingBox())!.y).toBe(0)
})
