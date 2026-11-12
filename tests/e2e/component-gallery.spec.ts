import { expect, test } from "@playwright/test"
import type { Locator, Page } from "@playwright/test"

const galleryPath = "/v6/en/guide/components/"
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

test("gallery compare slider moves the divider by keyboard and pointer", async ({ page }) => {
  const compare = page.locator("#gallery-compare-slider")
  const stage = compare.locator('[data-rcs="root"]')
  const slider = compare.getByRole("slider", {
    name: "Hero illustration: Light left of the divider, Dark right of it",
    exact: true,
  })
  // react-compare-slider clips both views at this position.
  const position = () =>
    stage.evaluate((element) => element.style.getPropertyValue("--rcs-raw-position"))

  await expect(slider).toHaveAttribute("aria-valuenow", "50")
  await expect(slider).toHaveAttribute("aria-valuetext", "Light 50%, Dark 50%")
  await expect(
    compare.getByRole("img", { name: "Hero illustration in the light theme" })
  ).toBeVisible()
  expect(await position()).toBe("50%")

  await slider.focus()
  await slider.press("ArrowRight")
  await slider.press("ArrowRight")
  await expect(slider).toHaveAttribute("aria-valuenow", "54")
  await expect(slider).toHaveAttribute("aria-valuetext", "Light 54%, Dark 46%")

  await slider.press("Home")
  await expect(slider).toHaveAttribute("aria-valuenow", "0")
  expect(await position()).toBe("0%")
  await slider.press("End")
  await expect(slider).toHaveAttribute("aria-valuenow", "100")
  expect(await position()).toBe("100%")

  const box = await stage.boundingBox()
  if (!box) throw new Error("Expected the compare slider to be laid out")
  await page.mouse.click(box.x + box.width * 0.25, box.y + box.height / 2)
  await expect
    .poll(async () => Number(await slider.getAttribute("aria-valuenow")))
    .toBeGreaterThanOrEqual(23)
  expect(Number(await slider.getAttribute("aria-valuenow"))).toBeLessThanOrEqual(27)
})

test("hero images follow the selected theme and the system preference", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" })
  await page.evaluate(() => localStorage.setItem("ardo-theme", "light"))
  await page.reload()
  const hero = page.locator("#gallery-hero")
  const variants = hero.getByRole("img", { name: "Documentation preview", includeHidden: true })
  const light = variants.nth(0)
  const dark = variants.nth(1)
  await expect(light).toBeVisible()
  await expect(dark).toBeHidden()
  await expect(hero.getByRole("img", { name: "Documentation preview" })).toHaveCount(1)
  await page.evaluate(() => document.fonts.ready)
  const lightBounds = await light.boundingBox()
  expect(lightBounds).not.toBeNull()

  await page.getByRole("button", { name: "Switch to dark theme", exact: true }).click()
  await expect(light).toBeHidden()
  await expect(dark).toBeVisible()
  await expect.poll(() => dark.boundingBox()).toEqual(lightBounds)
  await expect(hero.getByRole("img", { name: "Documentation preview" })).toHaveCount(1)

  await page.reload()
  await expect(dark).toBeVisible()
  await page.getByRole("button", { name: "Switch to system theme", exact: true }).click()
  await expect(light).toBeVisible()
  await expect(dark).toBeHidden()
  await page.emulateMedia({ colorScheme: "dark" })
  await expect(dark).toBeVisible()
  await expect(light).toBeHidden()
})

// Measure resolved browser colors so prose selectors cannot silently erase CTA contrast.
async function buttonContrast(button: Locator) {
  return button.evaluate((element) => {
    const style = getComputedStyle(element)
    const stops = style.backgroundImage.match(/oklch\([^)]+\)/g)
    if (stops?.length !== 2)
      throw new Error(`Expected two gradient stops: ${style.backgroundImage}`)
    const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true })
    if (!context) throw new Error("Canvas is unavailable for contrast measurement")
    context.filter = style.filter
    const luminance = (color: string) => {
      if (!CSS.supports("color", color)) throw new Error(`Unsupported color: ${color}`)
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = color
      context.fillRect(0, 0, 1, 1)
      const channels = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map((channel) => {
        const value = channel / 255
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
    }
    const foreground = luminance(style.color)
    return Math.min(
      ...stops.map((stop) => {
        const background = luminance(stop)
        return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05)
      })
    )
  })
}

for (const theme of ["light", "dark"] as const) {
  test(`MDX preserves hero typography and readable actions in ${theme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
    await page.evaluate((theme) => localStorage.setItem("ardo-theme", theme), theme)
    await page.reload()
    const hero = page.locator("#gallery-hero")
    const button = hero.getByRole("link", { name: "Read the guide", exact: true })
    await expect(button).toBeVisible()
    await expect(button).toHaveCSS("text-decoration-line", "none")
    await expect.poll(() => buttonContrast(button)).toBeGreaterThanOrEqual(4.5)
    await button.hover()
    await expect.poll(() => buttonContrast(button)).toBeGreaterThanOrEqual(4.5)
    await button.press("Tab")
    await page.keyboard.press("Shift+Tab")
    await expect(button).toBeFocused()
    expect(await button.evaluate((element) => element.matches(":focus-visible"))).toBe(true)
    await expect.poll(() => buttonContrast(button)).toBeGreaterThanOrEqual(4.5)

    const title = hero.getByText("Your project, clearly explained.", { exact: true })
    expect(
      await title.evaluate((element) => parseFloat(getComputedStyle(element).fontSize))
    ).toBeGreaterThanOrEqual(26)
    await expect(title).toHaveCSS("font-weight", "650")
    await expect(
      page.locator(".ardo-content").getByRole("link", { name: "Theming", exact: true })
    ).toHaveCSS("text-decoration-line", "underline")
    await expect(
      page
        .locator(".ardo-content p")
        .filter({ hasText: "In MDX, use the components without imports" })
    ).toHaveCSS("font-size", "16px")
  })
}

test("mobile navigation retains usable controls and wrapping breadcrumbs with enlarged text", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%"
  })
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb", exact: true })
  await expect(breadcrumb).toBeVisible()
  const bounds = await breadcrumb.evaluate((element) =>
    [...element.querySelectorAll("span")].map((span) => {
      const rect = span.getBoundingClientRect()
      return { left: rect.left, right: rect.right }
    })
  )
  for (const rect of bounds) {
    expect(rect.left).toBeGreaterThanOrEqual(0)
    expect(rect.right).toBeLessThanOrEqual(320)
  }
  const toggle = page.getByRole("button", { name: "Toggle menu", exact: true })
  const toggleBox = await toggle.boundingBox()
  expect(toggleBox?.width).toBeGreaterThanOrEqual(44)
  expect(toggleBox?.height).toBeGreaterThanOrEqual(44)
  await toggle.focus()
  await page.keyboard.press("Enter")
  const menu = page.getByRole("dialog", { name: /navigation menu/ })
  await expect(menu).toBeVisible()
  const nav = menu.locator(".ardo-nav")
  const navBounds = await nav.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    links: [...element.querySelectorAll("a")].map((link) => {
      const rect = link.getBoundingClientRect()
      return { left: rect.left, right: rect.right }
    }),
  }))
  expect(navBounds.scrollWidth).toBeLessThanOrEqual(navBounds.clientWidth)
  for (const link of navBounds.links) {
    expect(link.left).toBeGreaterThanOrEqual(0)
    expect(link.right).toBeLessThanOrEqual(320)
  }
  const close = menu.getByRole("button", { name: "Close menu", exact: true })
  const closeBox = await close.boundingBox()
  expect(closeBox?.width).toBeGreaterThanOrEqual(44)
  expect(closeBox?.height).toBeGreaterThanOrEqual(44)
  await page.keyboard.press("Escape")
  await expect(menu).toBeHidden()
  await expect(toggle).toBeFocused()
})

test("cards wrap long titles and descriptions within narrow columns", async ({ page }) => {
  const card = page
    .getByRole("link")
    .filter({ has: page.locator("h3") })
    .first()
  await card.evaluate((element) => {
    const heading = element.querySelector("h3")
    const paragraph = element.querySelector("p")
    if (!heading || !paragraph) throw new Error("Expected the gallery's linked card")
    heading.textContent = "@example/documentation-runtime-with-an-unbroken-package-identifier"
    paragraph.textContent = "https://example.test/documentation/" + "long-path-segment".repeat(12)
  })
  for (const width of [320, 390, 720, 1440]) {
    await page.setViewportSize({ width, height: 844 })
    const bounds = await card.evaluate((element) => ({
      left: element.getBoundingClientRect().left,
      right: element.getBoundingClientRect().right,
      widths: [element, ...element.querySelectorAll("h3, p")].map((node) => ({
        client: node.clientWidth,
        scroll: node.scrollWidth,
      })),
    }))
    expect(bounds.left).toBeGreaterThanOrEqual(0)
    expect(bounds.right).toBeLessThanOrEqual(width)
    for (const measured of bounds.widths) {
      expect(measured.scroll).toBeLessThanOrEqual(measured.client + 1)
    }
  }
})

test("tabs, code groups, and cards keep compact, balanced spacing", async ({ page }) => {
  // One-line MDX labels arrive wrapped in a paragraph (ferromark#621); its
  // margins must not stretch the triggers.
  const triggerHeights = await page
    .locator("#gallery-tabs [role=tab], #gallery-package-managers button")
    .evaluateAll((triggers) => triggers.map((trigger) => trigger.getBoundingClientRect().height))
  expect(triggerHeights.length).toBeGreaterThan(0)
  for (const height of triggerHeights) expect(height).toBeLessThan(40)

  const card = page
    .getByRole("link")
    .filter({ has: page.locator("h3") })
    .first()
  const textMargins = await card.evaluate((element) => {
    const text = element.querySelector("p")
    if (!text) throw new Error("Expected the gallery's linked card body")
    const style = getComputedStyle(text)
    return [style.marginTop, style.marginBottom]
  })
  expect(textMargins).toStrictEqual(["0px", "0px"])
})
