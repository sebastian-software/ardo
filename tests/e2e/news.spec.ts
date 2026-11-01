import { expect, test } from "@playwright/test"

const releases = [
  { slug: "ardo-6-1", publishedAt: "2026-11-01T22:02:42.000Z" },
  { slug: "ardo-6", publishedAt: "2026-10-29T21:10:31.000Z" },
]

for (const locale of ["en", "de", "fr", "es"]) {
  test(`${locale} release posts are complete static pages with chronological feeds`, async ({
    browser,
    request,
    baseURL,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL })
    const page = await context.newPage()
    try {
      await page.goto(`/${locale}/news/`)
      await expect(page.locator("html")).toHaveAttribute("lang", locale)
      const links = page.locator(".ardo-post-list h2 a")
      await expect(links).toHaveCount(2)
      expect(
        await links.evaluateAll((elements) => elements.map((link) => link.getAttribute("href")))
      ).toEqual(releases.map(({ slug }) => `/${locale}/news/${slug}/`))
      expect(
        await page
          .locator(".ardo-post-list time")
          .evaluateAll((elements) => elements.map((time) => time.getAttribute("datetime")))
      ).toEqual(releases.map(({ publishedAt }) => publishedAt))

      for (const { slug, publishedAt } of releases) {
        await page.goto(`/${locale}/news/${slug}/`)
        await expect(page.locator(".ardo-post h1")).toBeVisible()
        await expect(page.locator(".ardo-post-body h2").first()).toBeVisible()
        await expect(page.locator(".ardo-post time").first()).toHaveAttribute(
          "datetime",
          publishedAt
        )
        await expect(page.locator('a[rel="author"]')).toHaveText("Sebastian Werner")
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          "href",
          `https://ardo-docs.dev/${locale}/news/${slug}`
        )
        await expect(
          page
            .locator('a[href*="/guide/publications/"], a[href*="/guide/releases/upgrade-to-v6/"]')
            .first()
        ).toHaveAttribute("href", new RegExp(`^/v6/${locale}/guide/`))
      }

      for (const feed of ["atom", "rss"]) {
        const response = await request.get(`/${locale}/news/${feed}.xml`)
        expect(response.ok()).toBe(true)
        const xml = await response.text()
        expect(xml).toContain("e26831f6-8a6f-45c9-9683-c51b25f88161")
        expect(xml).toContain("b84b6328-070e-46de-97d6-7edcc1000d60")
        expect(xml).toContain(`https://ardo-docs.dev/${locale}/news/ardo-6-1/`)
        expect(xml).toContain(`https://ardo-docs.dev/v6/${locale}/guide/publications/`)
        expect(xml).toContain("Sharp")
        expect(xml).toContain("libvips")
        expect(xml).toContain(".jpg")
      }
    } finally {
      await context.close()
    }
  })
}

test("news navigation crosses route scopes and preserves its article when switching language", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/en/")
  await page.getByRole("banner").getByRole("link", { name: "News", exact: true }).click()
  await expect(page).toHaveURL(/\/en\/news\/$/)
  await page.locator(".ardo-post-list h2 a").first().click()
  await expect(page).toHaveURL(/\/en\/news\/ardo-6-1\/$/)
  await expect(page.getByRole("combobox", { name: "Version", exact: true })).toHaveCount(0)
  await page.getByRole("combobox", { name: "Language", exact: true }).selectOption("de")
  await expect(page).toHaveURL(/\/de\/news\/ardo-6-1\/$/)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Ardo 6.1: Platz für Neuigkeiten"
  )
  await page.getByRole("banner").getByRole("link", { name: "Anleitung", exact: true }).click()
  await expect(page).toHaveURL(/\/v6\/de\/guide\/getting-started\/$/)
  await expect(page.getByRole("combobox", { name: "Version", exact: true })).toBeVisible()

  // A former versioned homepage now enters the documentation, while its logo returns to the site.
  await page.goto("/v6/de/")
  await expect(page).toHaveURL(/\/v6\/de\/guide\//)
  await page
    .getByRole("banner")
    .getByRole("link", { name: /^Ardo(?: Ardo)?$/ })
    .click()
  await expect(page).toHaveURL(/\/de\/$/)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://ardo-docs.dev/de/"
  )
  expect(errors).toEqual([])
})

test("release articles keep responsive images and usable navigation on a narrow screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/en/news/ardo-6/")
  const image = page.locator(".ardo-post-body picture img")
  await expect(image).toHaveAttribute("src", /\.jpg$/)
  await expect
    .poll(() =>
      image.evaluate(
        (element: HTMLImageElement) =>
          element.complete && element.naturalWidth > 0 && element.currentSrc.endsWith(".avif")
      )
    )
    .toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await page.getByRole("banner").getByRole("button", { name: "Toggle menu", exact: true }).click()
  const menu = page.getByRole("dialog")
  await expect(menu.getByRole("combobox", { name: "Version", exact: true })).toHaveCount(0)
  await menu.getByRole("link", { name: "News", exact: true }).click()
  await expect(page).toHaveURL(/\/en\/news\/$/)
})
