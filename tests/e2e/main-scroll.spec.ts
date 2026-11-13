import { expect, type Page, test } from "@playwright/test"

const guide = "/v6/en/guide/getting-started/"

function mainScrollTop(page: Page) {
  return page.locator("#main-content").evaluate((main) => main.scrollTop)
}

test("scroll keys move the docs content right after load", async ({ page }) => {
  await page.goto(guide)
  await page.waitForLoadState("networkidle")

  await page.keyboard.press("PageDown")

  await expect.poll(() => mainScrollTop(page)).toBeGreaterThan(300)
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true)
  await page.keyboard.press("Tab")
  await expect(page.locator('a[href="#main-content"]')).toBeFocused()
})

test("a reload keeps the reading position", async ({ page }) => {
  await page.goto(guide)
  await page.locator("#main-content").evaluate((main) => {
    main.scrollTop = 1200
  })

  await page.reload()

  expect(await mainScrollTop(page)).toBe(1200)
})

test("a fragment still lands on its heading", async ({ page }) => {
  await page.goto(guide)
  await page.locator("#main-content").evaluate((main) => {
    main.scrollTop = 1200
  })
  await page.goto("/v6/en/guide/markdown/")
  await page.goto(`${guide}#development`)

  const heading = await page.locator("#development").boundingBox()
  expect(heading?.y).toBeGreaterThanOrEqual(0)
  expect(heading?.y).toBeLessThan(200)
})
