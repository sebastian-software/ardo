import { expect, test, type Page } from "@playwright/test"

/** Uncaught errors and console errors, which include React's hydration mismatches. */
function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  return errors
}

test("hydrates the custom shell's home page", async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto("/")
  const counter = page.getByRole("button", { name: "Count: 0" })
  await expect(counter).toBeVisible()
  await expect(async () => {
    await counter.click()
    await expect(page.getByRole("button", { name: /Count: [1-9]/u })).toBeVisible({ timeout: 500 })
  }).toPass({ timeout: 15_000 })
  expect(errors).toEqual([])
})

for (const [name, pathname, text] of [
  ["a Markdown page", "/notes/", "A Markdown page renders without ArdoRoot."],
  ["a Markdown post", "/news/hello/", "The post body is plain Markdown."],
  ["the root's custom frontmatter link", "/news/hello/", "Deutsch"],
] as const) {
  test(`hydrates ${name} without ArdoProvider`, async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto(pathname)
    await expect(page.locator('main[data-shell="custom"]')).toContainText(text)
    await page.waitForLoadState("networkidle")
    expect(errors).toEqual([])
  })
}

// The index and tag modules compute the root's page data while the page renders, on both sides.
for (const [pathname, href] of [
  ["/news/", "https://de.example.test/journal?posts=2"],
  ["/news/tags/design/", "https://de.example.test/journal/schlagworte/design?posts=1"],
  ["/news/tags/process/", "https://de.example.test/journal/schlagworte/process?posts=1"],
] as const) {
  test(`hydrates the root's page data on ${pathname}`, async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto(pathname)
    await page.waitForLoadState("networkidle")
    await expect(page.locator("a[data-counterpart]")).toHaveAttribute("href", href)
    expect(errors).toEqual([])
  })
}
