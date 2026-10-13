import { expect, test } from "@playwright/test"

test("hydrates the Basic example's React component", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))

  await page.goto("/")
  const counter = page.getByRole("button", { name: "Count: 0", exact: true })
  await counter.click()
  await expect(page.getByRole("button", { name: "Count: 1", exact: true })).toBeVisible()
  expect(errors).toEqual([])
})
