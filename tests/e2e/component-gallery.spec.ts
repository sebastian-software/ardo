import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"

const galleryPath = "/v6/guide/component-playground/"
const galleryErrors = new WeakMap<Page, string[]>()

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  galleryErrors.set(page, errors)
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto(galleryPath)
  await expect(page.getByRole("heading", { level: 1, name: "Components" })).toBeVisible()
})

test.afterEach(async ({ page }) => {
  expect(galleryErrors.get(page)).toStrictEqual([])
})

test("gallery tabs switch panels with the pointer and keyboard", async ({ page }) => {
  const tabs = page.locator("#gallery-tabs")
  const pnpm = tabs.getByRole("tab", { name: "pnpm", exact: true })
  const npm = tabs.getByRole("tab", { name: "npm", exact: true })
  const yarn = tabs.getByRole("tab", { name: "yarn", exact: true })

  await expect(pnpm).toHaveAttribute("aria-selected", "true")
  await expect(tabs.getByRole("tabpanel", { name: "pnpm", exact: true })).toContainText(
    "pnpm add ardo"
  )

  await npm.click()
  await expect(npm).toHaveAttribute("aria-selected", "true")
  await expect(tabs.getByRole("tabpanel", { name: "npm", exact: true })).toContainText(
    "npm install ardo"
  )
  await expect(tabs.getByRole("tabpanel", { name: "pnpm", exact: true })).toBeHidden()

  await npm.press("ArrowRight")
  await expect(yarn).toBeFocused()
  await expect(tabs.getByRole("tabpanel", { name: "yarn", exact: true })).toContainText(
    "yarn add ardo"
  )

  await yarn.press("Home")
  await expect(pnpm).toBeFocused()
  await expect(pnpm).toHaveAttribute("aria-selected", "true")

  await pnpm.press("End")
  await expect(yarn).toBeFocused()
  await expect(yarn).toHaveAttribute("aria-selected", "true")
})

test("gallery accordions expand by pointer and keyboard and keep one grouped item open", async ({
  page,
}) => {
  const accordion = page.locator("#gallery-accordion")
  const firstTitle = "Can I use React components?"
  const secondTitle = "Does it work without a server?"
  const first = accordion.getByRole("button", { name: firstTitle, exact: true })
  const second = accordion.getByRole("button", { name: secondTitle, exact: true })
  const firstPanel = accordion.getByRole("region", { name: firstTitle, exact: true })
  const secondPanel = accordion.getByRole("region", { name: secondTitle, exact: true })
  const firstAnswer = firstPanel.getByText(
    "Yes. Import a component into an MDX route and render it alongside your prose.",
    { exact: true }
  )
  const secondAnswer = secondPanel.getByText(
    "Yes. The production build contains prerendered HTML and static assets.",
    { exact: true }
  )

  await expect(first).toHaveAttribute("aria-expanded", "false")
  await expect(second).toHaveAttribute("aria-expanded", "false")

  await first.click()
  await expect(firstAnswer).toBeVisible()
  await expect(first).toHaveAttribute("aria-expanded", "true")

  await second.press("Space")
  await expect(secondAnswer).toBeVisible()
  await expect(second).toHaveAttribute("aria-expanded", "true")
  await expect(first).toHaveAttribute("aria-expanded", "false")
  await expect(firstAnswer).toBeHidden()

  await second.press("Enter")
  await expect(second).toHaveAttribute("aria-expanded", "false")
  await expect(secondAnswer).toBeHidden()
})

test("gallery code copies the displayed command and confirms success", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })
  const code = page.locator("#gallery-code")
  await expect(code).toContainText("pnpm add ardo")
  await code.hover()
  await code.getByRole("button", { name: "Copy code", exact: true }).click()

  await expect(code.getByRole("button", { name: "Copied!", exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("pnpm add ardo")
})

test("gallery code groups switch files and copy the active snippet", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })
  const group = page.locator("#gallery-code-group")
  const configuration = group.getByText("ardo.config.ts", { exact: true })
  const home = group.getByText("app/routes/home.md", { exact: true })
  await expect(configuration).toBeVisible()
  await expect(home).toBeHidden()

  await group.getByRole("button", { name: "Home route", exact: true }).click()
  await expect(home).toBeVisible()
  await expect(configuration).toBeHidden()
  await group.hover()
  await group.getByRole("button", { name: "Copy code", exact: true }).click()

  await expect(group.getByRole("button", { name: "Copied!", exact: true })).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("# Welcome\n\nStart with your first guide.")

  await group.getByRole("button", { name: "Configuration", exact: true }).click()
  await expect(configuration).toBeVisible()
  await expect(home).toBeHidden()
})
