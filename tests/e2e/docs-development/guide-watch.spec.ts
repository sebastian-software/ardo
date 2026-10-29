import { expect, test } from "@playwright/test"
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

// Set by Playwright after the development server binds its dynamically assigned port.
test.use({ baseURL: process.env.ARDO_DOCS_DEV_URL })

test("MDX and PO edits regenerate coherent server and browser content without hydration errors", async ({
  page,
}) => {
  const root = path.resolve(import.meta.dirname, "../../..")
  const sourceFile = path.join(root, "docs/app/content/guide/internationalization.mdx")
  const catalogFile = path.join(root, "docs/app/i18n/guides/de.po")
  const [source, catalog] = await Promise.all([
    readFile(sourceFile, "utf8"),
    readFile(catalogFile, "utf8"),
  ])
  const errors: string[] = []
  let connected = false
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) connected = false
  })
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.text() === "[vite] connected.") connected = true
    if (message.type() === "error") errors.push(message.text())
  })
  const watchedTitle = "Internationalisierung – Watch-Test"
  const extraParagraph = page
    .locator("main p")
    .filter({ hasText: /^Internationalisierung – Watch-Test$/ })
  const clickCounter = async () => {
    await page.getByRole("button", { name: "0 Klicks", exact: true }).click()
    await expect(page.getByRole("button", { name: "1 Klick", exact: true })).toBeVisible()
    // A warm page can hydrate before its new HMR websocket has connected.
    await expect.poll(() => connected).toBe(true)
  }
  try {
    await page.goto("/v6/de/guide/internationalization/")
    await expect(
      page.getByRole("heading", { level: 1, name: "Internationalisierung", exact: true })
    ).toBeVisible()
    await clickCounter()
    expect(catalog).toContain('msgstr "Internationalisierung"')
    await writeFile(
      catalogFile,
      catalog.replace('msgstr "Internationalisierung"', `msgstr "${watchedTitle}"`)
    )
    await expect(
      page.getByRole("heading", { level: 1, name: watchedTitle, exact: true })
    ).toBeVisible()
    await clickCounter()

    // Reuse an existing translation unit to isolate source watching from extraction.
    await writeFile(sourceFile, `${source}\nInternationalization\n`)
    await expect(extraParagraph).toHaveCount(1)
    await clickCounter()
  } finally {
    await Promise.all([writeFile(sourceFile, source), writeFile(catalogFile, catalog)])
  }
  await expect(
    page.getByRole("heading", { level: 1, name: "Internationalisierung", exact: true })
  ).toBeVisible()
  await expect(extraParagraph).toHaveCount(0)
  await clickCounter()
  expect(errors).toEqual([])
})
