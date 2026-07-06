import { expect, test } from "@playwright/test"

test("built docs site hydrates and supports search and theme interactions", async ({ page }) => {
  const consoleErrors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text())
    }
  })

  await page.goto("/guide/getting-started")

  await expect(page.getByRole("heading", { level: 1, name: "Getting Started" })).toBeVisible()

  await page.getByRole("button", { name: /Switch to .* theme/ }).click()
  await expect(page.locator("html")).toHaveClass(/light|dark/)

  const searchInput = page.getByRole("combobox", { name: "Search" }).last()
  await searchInput.fill("markdown")
  await expect(page.getByRole("option", { name: /Markdown/ }).first()).toBeVisible()
  await searchInput.press("Enter")
  await expect(page).toHaveURL(/\/guide\/markdown/)

  expect(consoleErrors.filter((message) => !message.includes("favicon"))).toEqual([])
})

test("mobile docs navigation opens as a dialog and restores route navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto("/guide/getting-started")

  await page.getByRole("button", { name: "Toggle menu" }).click()
  const menu = page.getByRole("dialog", { name: /Ardo navigation menu/ })
  await expect(menu).toBeVisible()

  await menu.getByRole("link", { name: "Markdown Features" }).click()

  await expect(page).toHaveURL(/\/guide\/markdown/)
  await expect(menu).toBeHidden()
})
