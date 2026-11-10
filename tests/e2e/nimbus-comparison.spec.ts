import { expect, test } from "@playwright/test"

const locales = [
  { id: "en", language: "Language", heading: "Feature Comparison" },
  { id: "de", language: "Sprache", heading: "Funktionsvergleich" },
  { id: "fr", language: "Langue", heading: "Comparaison des fonctionnalités" },
  { id: "es", language: "Idioma", heading: "Comparación de funciones" },
]

for (const { id, heading } of locales) {
  test(`${id} reaches the localized unversioned comparison from the homepage and guide`, async ({
    page,
  }) => {
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    await page.goto(`/${id}/`)
    await page.getByRole("link", { name: /^Nimbus /u }).click()
    await expect(page).toHaveURL(new RegExp(`/${id}/compare/nimbus/$`))
    await expect(page.locator("html")).toHaveAttribute("lang", id)
    await expect(page.getByRole("heading", { level: 1, name: "Ardo vs Nimbus" })).toBeVisible()
    await expect(page.getByRole("heading", { level: 2, name: heading })).toBeVisible()
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://ardo-docs.dev/${id}/compare/nimbus`
    )
    for (const alternative of locales)
      await expect(
        page.locator(`link[rel="alternate"][hreflang="${alternative.id}"]`)
      ).toHaveAttribute("href", `https://ardo-docs.dev/${alternative.id}/compare/nimbus`)
    await expect(page.getByRole("combobox", { name: "Version", exact: true })).toHaveCount(0)
    await expect(
      page.locator('a[href*="/edit/main/docs/app/content/compare/nimbus.mdx"]').first()
    ).toHaveAttribute(
      "href",
      "https://github.com/sebastian-software/ardo/edit/main/docs/app/content/compare/nimbus.mdx"
    )
    await page.goto(`/v6/${id}/guide/what-is-ardo/`)
    await page
      .locator(".ardo-content-body")
      .getByRole("link", { name: "Nimbus", exact: true })
      .click()
    await expect(page).toHaveURL(new RegExp(`/${id}/compare/nimbus/$`))
    expect(errors).toEqual([])
  })
}

test("comparison language switches retain the site path and heading anchor", async ({ page }) => {
  await page.goto("/en/compare/nimbus/?from=compare#coming-from-nimbus")
  for (const [index, locale] of locales.entries()) {
    const next = locales[(index + 1) % locales.length]
    await page.getByRole("combobox", { name: locale.language, exact: true }).selectOption(next.id)
    await expect(page).toHaveURL(
      new RegExp(`/${next.id}/compare/nimbus/\\?from=compare#coming-from-nimbus$`)
    )
    await expect(page.locator("#coming-from-nimbus")).toBeInViewport()
  }
})

test("comparison and its homepage entry remain readable on desktop and mobile", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/en/compare/nimbus/")
  await page.screenshot({ path: testInfo.outputPath("comparison-desktop.png"), fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/de/compare/nimbus/")
  await expect(page.getByRole("heading", { level: 1, name: "Ardo vs Nimbus" })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true
  )
  await page.screenshot({ path: testInfo.outputPath("comparison-mobile.png"), fullPage: true })
  await page.goto("/de/")
  const entry = page.getByRole("link", { name: /^Nimbus /u })
  await entry.scrollIntoViewIfNeeded()
  await expect(entry).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath("comparison-home-entry.png") })
})
