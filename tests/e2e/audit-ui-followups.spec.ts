import { expect, test } from "@playwright/test"

test("a denied homepage copy offers a selected manual prompt", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new DOMException("Denied", "NotAllowedError")) },
    })
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/v6/")
  await page.getByRole("button", { name: "Copy prompt", exact: true }).click()
  await expect(page.getByRole("status")).toHaveText(
    "Copying failed. Copy the prompt below manually."
  )
  const prompt = page.getByRole("textbox", { name: "Setup prompt", exact: true })
  await expect(prompt).toBeFocused()
  await expect(prompt).toHaveValue(
    "Set up Ardo in this repository and follow the official instructions."
  )
  expect(
    await prompt.evaluate((element: HTMLTextAreaElement) =>
      element.value.slice(element.selectionStart, element.selectionEnd)
    )
  ).toBe(await prompt.inputValue())
})

test("an overflowing API code block can be reached and scrolled by keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/v6/api-reference/types/ardolinkprops/")
  const code = page.locator(".ardo-code-block pre").first()
  await expect(code).toHaveAttribute("tabindex", "0")
  expect(await code.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true)
  await code.focus()
  await page.keyboard.press("Shift+Tab")
  await page.keyboard.press("Tab")
  await expect(code).toBeFocused()
  await code.press("ArrowRight")
  await expect.poll(() => code.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)
})
