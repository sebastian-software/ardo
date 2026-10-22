import { expect, test } from "@playwright/test"

test("failed search recovers by reloading once and keeps short-viewport results visible", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.setViewportSize({ width: 844, height: 390 })
  await page.route("**/assets/search-index-*.js", (route) => route.abort("failed"))
  await page.goto("/v6/guide/getting-started/")
  await page.getByRole("button", { name: "Search", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "Search", exact: true })
  const input = dialog.getByRole("combobox", { name: "Search", exact: true })
  await input.fill("markdown")

  const reload = dialog.getByRole("button", { name: "Reload search", exact: true })
  await expect(reload).toBeVisible()
  await expect(input).toHaveValue("markdown")
  await page.unroute("**/assets/search-index-*.js")
  await Promise.all([page.waitForEvent("load"), reload.click()])

  await expect(dialog).toBeVisible()
  await expect(input).toHaveValue("markdown")
  await expect(input).toBeFocused()
  await expect(dialog.getByRole("option").first()).toBeVisible()
  for (let step = 0; step < 4; step++) await input.press("ArrowDown")
  const selected = dialog.getByRole("option", { selected: true })
  await expect(selected).toBeInViewport({ ratio: 1 })
  await expect(dialog.getByText("to close", { exact: false })).toBeInViewport({ ratio: 1 })

  await page.reload()
  await expect(dialog).toBeHidden()
  expect(errors).toEqual([])
})
