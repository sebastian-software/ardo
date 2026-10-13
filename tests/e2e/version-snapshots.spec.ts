import { expect, test } from "@playwright/test"

test.describe("preserved documentation releases", () => {
  test.skip(process.env.ARDO_E2E_PAGES_ARTIFACT !== "true", "Requires the prepared Pages artifact")

  for (const version of ["v3", "v4", "v5"]) {
    test(`${version} keeps working pages, assets, and search`, async ({ page, baseURL }) => {
      const consoleErrors: string[] = []
      const failedLocalResponses: string[] = []
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text())
      })
      page.on("pageerror", (error) => consoleErrors.push(error.message))
      page.on("response", (response) => {
        if (response.url().startsWith(baseURL!) && response.status() >= 400) {
          failedLocalResponses.push(`${response.status()} ${response.url()}`)
        }
      })

      await page.goto(`/${version}/guide/getting-started`)
      await expect(page.getByRole("heading", { level: 1, name: "Getting Started" })).toBeVisible()
      const search = page.getByRole("combobox", { name: "Search", exact: true }).last()
      await search.fill("markdown")
      await expect(
        page.getByRole("listbox", { name: "Search results" }).getByRole("option").first()
      ).toBeVisible()
      await search.press("Enter")
      await expect(page).not.toHaveURL(`/${version}/guide/getting-started`)
      await expect(page).toHaveURL(new RegExp(`/${version}/guide/`))

      expect(consoleErrors).toEqual([])
      expect(failedLocalResponses).toEqual([])
    })
  }

  test("v5 keeps version-scoped machine-readable docs", async ({ request }) => {
    const index = await request.get("/v5/llms.txt")
    expect(index.ok()).toBe(true)
    expect(await index.text()).toContain("https://ardo-docs.dev/v5/llms-full.txt")
    const full = await request.get("/v5/llms-full.txt")
    expect(full.ok()).toBe(true)
    expect(await full.text()).toContain("Getting Started")
  })
})
