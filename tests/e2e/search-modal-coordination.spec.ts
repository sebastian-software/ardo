import { expect, test } from "@playwright/test"

test.use({ hasTouch: true })

const gettingStarted = "/v6/guide/getting-started/"

test("the search shortcut replaces mobile navigation and restores the search trigger", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(gettingStarted)
  await page.getByRole("button", { name: "Toggle menu", exact: true }).tap()
  const menu = page.getByRole("dialog", { name: "Ardo navigation menu", exact: true })
  await expect(menu).toBeVisible()

  await page.keyboard.press("ControlOrMeta+k")
  const search = page.getByRole("dialog", { name: "Search", exact: true })
  const input = search.getByRole("combobox", { name: "Search", exact: true })
  await expect(menu).toBeHidden()
  await expect(page.getByRole("dialog")).toHaveCount(1)
  await expect(input).toBeFocused()
  await input.fill("markdown")
  await expect(search.getByRole("option").first()).toBeVisible()

  // A real pointer action catches a search panel hidden beneath the drawer backdrop.
  await search.getByRole("button", { name: "Close search", exact: true }).tap()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Search", exact: true })).toBeFocused()
})

test("an open search owns shortcut typing and focus return after a desktop resize", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(gettingStarted)
  await page.getByRole("button", { name: "Search", exact: true }).tap()
  const search = page.getByRole("dialog", { name: "Search", exact: true })
  const input = search.getByRole("combobox", { name: "Search", exact: true })
  await input.fill("markdown")
  await expect(search.getByRole("option").first()).toBeVisible()

  await page.setViewportSize({ width: 1440, height: 900 })
  await search.getByRole("button", { name: "Close search", exact: true }).focus()
  await page.keyboard.press("ControlOrMeta+k")
  await expect(input).toBeFocused()
  await page.keyboard.press("ControlOrMeta+a")
  await page.keyboard.type("accordion")
  await expect(input).toHaveValue("accordion")
  await expect(page.getByRole("listbox", { name: "Search results" })).toHaveCount(1)
  expect(
    await page.getByRole("combobox", { name: "Search", exact: true }).evaluateAll((elements) =>
      elements.map((element) => ({
        modal: element.closest('[role="dialog"]') != null,
        value: element.getAttribute("value"),
      }))
    )
  ).toContainEqual({ modal: false, value: "" })

  await page.keyboard.press("Escape")
  await expect(search).toBeHidden()
  await expect(page.getByRole("combobox", { name: "Search", exact: true })).toBeFocused()
})
