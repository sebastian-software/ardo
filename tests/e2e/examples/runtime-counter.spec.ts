import { expect, test } from "@playwright/test"

test("hydrates the Ardo runtime counter and updates it on click", async ({ page }) => {
  const pageErrors: string[] = []
  page.on("pageerror", (error) => pageErrors.push(error.message))

  await page.goto("/")
  const counter = page.getByTestId("runtime-counter")
  await expect(counter).toHaveText("Count: 0")
  await expect(counter).toHaveAttribute("data-hydrated", "true", { timeout: 15_000 })
  expect(pageErrors).toEqual([])
  await counter.click()
  await expect(counter).toHaveText("Count: 1")

  expect(pageErrors).toEqual([])
})
