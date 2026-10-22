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

test("compact outline leaves keyboard focus at its destination", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/v6/guide/getting-started/")
  const outline = page.locator(".ardo-page-outline")
  await outline.locator("summary").press("Enter")
  await outline.getByRole("link", { name: "Production Build", exact: true }).press("Enter")
  const heading = page.locator("#production-build")
  await expect(heading).toBeFocused()
  await expect(heading).toBeInViewport({ ratio: 1 })
  const scrollTop = await page.locator("#main-content").evaluate((element) => element.scrollTop)
  await page.keyboard.press("Tab")
  expect(await outline.evaluate((element) => element.contains(document.activeElement))).toBe(false)
  expect(await page.locator("#main-content").evaluate((element) => element.scrollTop)).toBe(
    scrollTop
  )
})

test("the page outline tracks a nested subsection while reading", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/v6/guide/getting-started/")
  await page.locator('[id="2-install-dependencies"]').evaluate((heading) => {
    const main = document.querySelector("#main-content")
    if (main != null) {
      main.scrollTop += heading.getBoundingClientRect().top - main.getBoundingClientRect().top - 40
    }
  })
  await expect(
    page
      .locator(".ardo-page-rail")
      .getByRole("link", { name: "2. Install dependencies", exact: true })
  ).toHaveAttribute("aria-current", "location")
})

test("a denied shared code copy offers selected exact source for manual copying", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new DOMException("Denied", "NotAllowedError")) },
    })
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/v6/guide/component-playground/")
  const code = page.locator("#gallery-code")
  await code.getByRole("button", { name: "Copy code", exact: true }).click()
  await expect(code.getByRole("status")).toHaveText(
    "Copying failed. Copy the selected code below manually."
  )
  const field = code.getByRole("textbox", { name: "Code to copy manually", exact: true })
  await expect(field).toBeFocused()
  await expect(field).toHaveValue("pnpm add ardo")
  expect(
    await field.evaluate((element: HTMLTextAreaElement) =>
      element.value.slice(element.selectionStart, element.selectionEnd)
    )
  ).toBe("pnpm add ardo")
})
