import { expect, test } from "@playwright/test"

const guide = "/v6/en/guide/getting-started/"

for (const width of [390, 1024, 1120, 1279, 1280, 1440, 1920]) {
  test(`marketing and docs use a full-width shell at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const bounds = []
    for (const path of ["/en/", guide]) {
      await page.goto(path)
      const frame = page.locator('[data-ardo-frame="viewport"]')
      const header = page.locator(".ardo-header > div").first()
      const frameBox = (await frame.boundingBox())!
      const headerBox = (await header.boundingBox())!
      expect(frameBox.width).toBe(width)
      expect(frameBox.x).toBe((width - frameBox.width) / 2)
      expect(headerBox.x).toBe(frameBox.x)
      expect(headerBox.width).toBe(frameBox.width)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
      bounds.push(frameBox.x)
    }
    expect(bounds[0]).toBe(bounds[1])
    const hasRail = width >= 1280
    await expect(page.locator(".ardo-page-rail")).toBeVisible({ visible: hasRail })
    const outline = page.locator(".ardo-page-outline")
    await expect(outline).toBeVisible({ visible: !hasRail })
    const text = page.locator(".ardo-content p").filter({ hasText: "Hand this sentence" }).first()
    const fontSize = await text.evaluate((element) =>
      parseFloat(getComputedStyle(element).fontSize)
    )
    expect(fontSize).toBeCloseTo(Math.min(18, Math.max(16, Math.min(width, 1440) * 0.0125)), 1)
    const textBox = (await text.boundingBox())!
    expect(textBox.width).toBeLessThanOrEqual(fontSize * 36 + 1)
    expect(textBox.width).toBeGreaterThan(Math.min(550, width - 50))
    await expect(page.locator(".ardo-code-block pre").first()).toHaveCSS("font-size", "14px")
  })
}

for (const width of [1024, 1280, 1440, 1920]) {
  test(`localized desktop headers fit without overlapping at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    for (const locale of ["en", "de", "fr", "es"]) {
      await page.goto(`/v6/${locale}/guide/getting-started/`)
      const header = page.locator(".ardo-header")
      const input = (await header.getByRole("combobox").first().boundingBox())!
      const nav = (await header.locator(".ardo-nav").boundingBox())!
      const logo = (await header.getByRole("link", { name: "Ardo", exact: true }).boundingBox())!
      expect(input.x).toBeGreaterThanOrEqual(logo.x + logo.width + 12)
      expect(nav.x).toBeGreaterThanOrEqual(input.x + input.width + 12)
    }
  })
}

test("a medium frame keeps the compact outline usable on a large monitor", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 900 })
  await page.goto(guide)
  await page
    .locator("[data-ardo-frame]")
    .evaluate((element) => element.setAttribute("data-ardo-frame", "page"))
  await page.addStyleTag({ content: ":root { --ardo-layout-pageMaxWidth: 69rem; }" })
  await expect(page.locator(".ardo-page-rail")).toBeHidden()
  const outline = page.locator(".ardo-page-outline")
  await outline.locator("summary").press("Enter")
  await outline.getByRole("link", { name: "Production Build", exact: true }).press("Enter")
  await expect(page.locator("#production-build")).toBeFocused()
})

for (const rootSize of ["125%", "200%"]) {
  test(`larger user text keeps navigation reachable at ${rootSize}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(guide)
    await page.addStyleTag({ content: `html { font-size: ${rootSize}; }` })
    await expect(page.locator(".ardo-page-rail")).toBeHidden()
    await expect(page.locator(".ardo-page-outline summary")).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440)
    expect(
      await page
        .locator(".ardo-content p")
        .filter({ hasText: "Hand this sentence" })
        .first()
        .evaluate((element) => parseFloat(getComputedStyle(element).fontSize))
    ).toBe(parseFloat(rootSize) * 0.16)
    if (rootSize === "200%") {
      await page.getByRole("button", { name: "Toggle menu", exact: true }).click()
      await expect(page.getByRole("dialog", { name: /Ardo navigation menu/ })).toBeVisible()
    }
  })
}

for (const zoom of [2, 4]) {
  test.describe(`${zoom * 100}% desktop zoom geometry`, () => {
    // Model a 1280×720 window with a smaller CSS viewport and larger pixel ratio.
    test.use({ viewport: { width: 1280 / zoom, height: 720 / zoom }, deviceScaleFactor: zoom })
    test("the article reflows and navigation remains reachable", async ({ page }) => {
      await page.goto(guide)
      await expect(page.locator(".ardo-sidebar").first()).toBeHidden()
      await expect(page.locator(".ardo-page-rail")).toBeHidden()
      await page.getByRole("button", { name: "Toggle menu", exact: true }).click()
      await expect(page.getByRole("dialog", { name: /Ardo navigation menu/ })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1280 / zoom)
    })
  })
}

test("theme tokens can fix the reading size and gutters", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 900 })
  await page.goto(guide)
  await page.addStyleTag({
    content: ":root { --ardo-fontSize-base: 1rem; --ardo-space-xl: 2rem; }",
  })
  await expect(
    page.locator(".ardo-content p").filter({ hasText: "Hand this sentence" }).first()
  ).toHaveCSS("font-size", "16px")
  await expect(page.locator("#main-content")).toHaveCSS("padding-left", "32px")
})

test("embedded hero text remains inside its column with doubled user text", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto("/v6/en/guide/components/")
  await page.addStyleTag({ content: "html { font-size: 200%; }" })
  const title = page
    .locator("#gallery-hero")
    .getByText("Your project, clearly explained.", { exact: true })
  const lines = await title.evaluate((element) => {
    const range = document.createRange()
    range.selectNodeContents(element)
    const bounds = element.getBoundingClientRect()
    return [...range.getClientRects()].map((rect) => ({
      left: rect.left - bounds.left,
      right: rect.right - bounds.right,
    }))
  })
  expect(lines.length).toBeGreaterThan(1)
  for (const line of lines) {
    expect(line.left).toBeGreaterThanOrEqual(-1)
    expect(line.right).toBeLessThanOrEqual(1)
  }
})

test("a narrow theme frame collapses navigation on a wide viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto(guide)
  await page
    .locator("[data-ardo-frame]")
    .evaluate((element) => element.setAttribute("data-ardo-frame", "page"))
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
  await page
    .locator("[data-ardo-frame]")
    .evaluate((element) => element.setAttribute("data-ardo-frame", "page"))
  const theme = await page.addStyleTag({ content: ":root { --ardo-layout-pageMaxWidth: 90rem; }" })
  await expect(page.locator(".ardo-page-rail")).toBeVisible()
  await expect(page.locator(".ardo-page-outline")).toBeHidden()
  expect((await page.locator("[data-ardo-frame]").boundingBox())!.width).toBe(1488)
  expect((await page.locator(".ardo-header").boundingBox())!.width).toBe(1488)
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

test("reading and reference widths stay bounded inside the full-width shell", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 900 })
  await page.goto(guide)
  const article = page.locator(".ardo-content")
  const reading = (await article.boundingBox())!
  expect(reading.width).toBeCloseTo(648, 0)
  expect((await page.locator(".ardo-sidebar").first().boundingBox())!.x).toBe(0)
  const doc = page.locator(".ardo-doc-page")
  await doc.evaluate((element) => element.setAttribute("data-content-width", "page"))
  expect((await article.boundingBox())!.width).toBeGreaterThan(reading.width)
  expect((await doc.boundingBox())!.width).toBe(1392)
  expect((await page.locator("[data-ardo-frame]").boundingBox())!.width).toBe(1920)
  await doc.evaluate((element) => {
    element.setAttribute("data-content-width", "reading")
    element.setAttribute("data-rail", "false")
  })
  expect((await doc.boundingBox())!.width).toBeCloseTo(648, 0)
})

test("generated API pages use the wider content measure automatically", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 900 })
  await page.goto("/v6/en/api-reference/functions/useardopage/")
  const doc = page.locator('.ardo-doc-page[data-content-width="page"]')
  expect((await doc.boundingBox())!.width).toBe(1392)
  await expect(page.locator(".ardo-page-rail")).toBeVisible()
})

for (const width of [390, 1920]) {
  test(`author content containers bound their children at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto("/v6/en/guide/components/")
    const container = page.locator("#gallery-content-container .ardo-content-container")
    const paragraph = container.locator("p")
    const textWidth = (await paragraph.boundingBox())!.width
    const fontSize = await paragraph.evaluate((element) =>
      parseFloat(getComputedStyle(element).fontSize)
    )
    expect(textWidth).toBeLessThanOrEqual(fontSize * 36 + 1)
    const box = (await container.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(width)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
  })
}
