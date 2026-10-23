import { expect, test } from "@playwright/test"

const docsBasePath = "/v6"
const gettingStartedPath = `${docsBasePath}/guide/getting-started`

test("versioned agent onboarding is available in HTML and machine-readable documentation", async ({
  page,
  request,
}) => {
  await page.goto(gettingStartedPath)
  await page.getByRole("link", { name: "Agent Instructions", exact: true }).last().click()
  await expect(page).toHaveURL(`${docsBasePath}/guide/agent-instructions/`)
  await expect(page.getByRole("heading", { level: 1, name: "Agent Instructions" })).toBeVisible()

  const index = await request.get(`${docsBasePath}/llms.txt`)
  expect(index.ok()).toBe(true)
  expect(await index.text()).toContain("https://ardo-docs.dev/v6/guide/agent-instructions")
  expect(await index.text()).toContain("https://ardo-docs.dev/v6/llms-full.txt")
  const full = await request.get(`${docsBasePath}/llms-full.txt`)
  expect(full.ok()).toBe(true)
  const instructions = await full.text()
  expect(instructions).toContain("\n### Match the Version First\n")
  expect(instructions).toContain("examples/basic")
  for (const removed of ["library", "monorepo", "content-sources", "github-pages"]) {
    expect(instructions).not.toContain(`examples/${removed}`)
  }

  // The former Basic Example page redirects to its section of the instructions.
  await page.goto(`${docsBasePath}/guide/reference-projects`)
  await expect(page).toHaveURL(`${docsBasePath}/guide/agent-instructions/`)
  await expect(page.getByRole("heading", { level: 2, name: "The Basic Example" })).toBeVisible()
})

test("built docs persist the selected theme and navigate search by keyboard", async ({ page }) => {
  const consoleErrors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text())
    }
  })

  await page.emulateMedia({ colorScheme: "light" })
  await page.goto(gettingStartedPath)

  await expect(page.getByRole("heading", { level: 1, name: "Getting Started" })).toBeVisible()

  await page.getByRole("button", { name: "Switch to light theme", exact: true }).click()
  await page.getByRole("button", { name: "Switch to dark theme", exact: true }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.reload()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect(
    page.getByRole("button", { name: "Switch to system theme", exact: true })
  ).toBeVisible()

  const searchInput = page.getByRole("combobox", { name: "Search" }).last()
  await page.keyboard.press("ControlOrMeta+k")
  await expect(searchInput).toBeFocused()
  await searchInput.fill("markdown")
  await expect(page.getByRole("option", { name: /Markdown/ }).first()).toBeVisible()
  await searchInput.press("ArrowDown")
  const selected = page.getByRole("listbox", { name: "Search results" }).getByRole("option").nth(1)
  await expect(selected).toHaveAttribute("aria-selected", "true")
  const target = (await selected.getAttribute("href")) ?? ""
  expect(target).toMatch(/^\/v6\/guide\//)
  await searchInput.press("Enter")
  await expect(page).toHaveURL(new URL(target, page.url()).href)

  expect(consoleErrors.filter((message) => !message.includes("favicon"))).toEqual([])
})

test("mobile docs navigation opens as a dialog and restores route navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto(gettingStartedPath)

  await expect(page.getByRole("heading", { level: 1, name: "Getting Started" })).toBeVisible()
  const trigger = page.getByRole("banner").last().getByRole("button", { name: "Toggle menu" })
  await trigger.click()
  const menu = page.getByRole("dialog", { name: /Ardo navigation menu/ })
  await expect(menu).toBeVisible()
  await expect(menu.getByRole("link", { name: "Ardo", exact: true })).toBeFocused()

  await page.keyboard.press("Escape")
  await expect(menu).toBeHidden()
  await expect(trigger).toBeFocused()
  await trigger.press("Enter")
  await expect(menu).toBeVisible()

  await menu.getByRole("link", { name: "Markdown & MDX" }).click()

  await expect(page).toHaveURL(/\/v6\/guide\/markdown/)
  await expect(menu).toBeHidden()
})

for (const width of [1280, 390]) {
  test(`compact page outline supports keyboard expansion and section navigation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto(gettingStartedPath)
    const outline = page.locator(".ardo-page-outline")
    const summary = outline.locator("summary")
    await expect(summary).toBeVisible()
    await expect(outline).not.toHaveAttribute("open")

    await summary.press("Enter")
    await expect(outline).toHaveAttribute("open")
    await outline.getByRole("link", { name: "Production Build", exact: true }).click()

    await expect(page).toHaveURL(/#production-build$/)
    await expect
      .poll(() =>
        page.locator("#production-build").evaluate((element) => {
          const bounds = element.getBoundingClientRect()
          return bounds.top >= 0 && bounds.bottom <= window.innerHeight
        })
      )
      .toBe(true)
  })
}

test("the default docs layout keeps its viewport-owned main scroll region", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto(gettingStartedPath)

  const main = page.locator("#main-content")
  await expect(main).toHaveCSS("overflow-y", "auto")

  const scrollState = await page.evaluate(() => {
    const mainElement = document.querySelector("#main-content")
    return {
      documentHeight: document.documentElement.scrollHeight,
      mainClientHeight: mainElement?.clientHeight ?? 0,
      mainScrollHeight: mainElement?.scrollHeight ?? 0,
      viewportHeight: window.innerHeight,
    }
  })
  expect(scrollState.mainScrollHeight).toBeGreaterThan(scrollState.mainClientHeight)
  expect(scrollState.documentHeight).toBeLessThanOrEqual(scrollState.viewportHeight + 1)
})

test("native Markdown fences render visible line numbers and highlighted lines", async ({
  page,
}) => {
  await page.goto(`${docsBasePath}/guide/markdown`)

  const numberedBlock = page.locator('[data-lang="typescript"]').filter({
    hasText: "const first = 1",
  })
  const firstLine = numberedBlock.locator('.line[data-ln="1"]')
  await expect(firstLine).toHaveCount(1)
  await expect(firstLine).toBeVisible()
  await expect(firstLine).toContainText("const first = 1")

  const highlightBlock = page.locator('[data-lang="typescript"]').filter({
    hasText: "function example()",
  })
  const highlightedLine = highlightBlock.locator('.line[data-line="2"].highlighted')
  const ordinaryLine = highlightBlock.locator('.line[data-line="3"]')
  await expect(highlightedLine).toHaveCount(1)
  await expect(ordinaryLine).toHaveCount(1)

  const lineNumberStyles = await firstLine.evaluate((element) => {
    const line = getComputedStyle(element)
    const number = getComputedStyle(element, "::before")
    const bounds = element.getBoundingClientRect()
    return {
      display: line.display,
      height: bounds.height,
      opacity: line.opacity,
      visibility: line.visibility,
      width: bounds.width,
      number: {
        color: number.color,
        content: number.content,
        display: number.display,
        fontSize: number.fontSize,
        opacity: number.opacity,
        visibility: number.visibility,
        width: number.width,
      },
    }
  })
  const highlightedStyles = await highlightedLine.evaluate((element) => {
    const computed = getComputedStyle(element)
    return {
      backgroundColor: computed.backgroundColor,
      borderLeftColor: computed.borderLeftColor,
      borderLeftStyle: computed.borderLeftStyle,
      borderLeftWidth: computed.borderLeftWidth,
    }
  })
  const ordinaryStyles = await ordinaryLine.evaluate((element) => {
    const computed = getComputedStyle(element)
    return {
      backgroundColor: computed.backgroundColor,
      borderLeftColor: computed.borderLeftColor,
    }
  })

  expect.soft(lineNumberStyles.display).not.toBe("none")
  expect.soft(lineNumberStyles.visibility).toBe("visible")
  expect.soft(Number(lineNumberStyles.opacity)).toBeGreaterThan(0)
  expect.soft(lineNumberStyles.width).toBeGreaterThan(0)
  expect.soft(lineNumberStyles.height).toBeGreaterThan(0)
  expect.soft(lineNumberStyles.number.content).toBe('"1"')
  expect.soft(lineNumberStyles.number.display).not.toBe("none")
  expect.soft(lineNumberStyles.number.visibility).toBe("visible")
  expect.soft(Number(lineNumberStyles.number.opacity)).toBeGreaterThan(0)
  expect.soft(Number.parseFloat(lineNumberStyles.number.width)).toBeGreaterThan(0)
  expect.soft(Number.parseFloat(lineNumberStyles.number.fontSize)).toBeGreaterThan(0)
  expect.soft(lineNumberStyles.number.color).not.toBe("rgba(0, 0, 0, 0)")
  expect.soft(highlightedStyles.backgroundColor).not.toBe("rgba(0, 0, 0, 0)")
  expect.soft(highlightedStyles.borderLeftColor).not.toBe("rgba(0, 0, 0, 0)")
  expect.soft(highlightedStyles.backgroundColor).not.toBe(ordinaryStyles.backgroundColor)
  expect.soft(highlightedStyles.borderLeftColor).not.toBe(ordinaryStyles.borderLeftColor)
  expect.soft(highlightedStyles.borderLeftWidth).toBe("3px")
  expect.soft(highlightedStyles.borderLeftStyle).toBe("solid")
})

test("consumer CSS overrides Ardo even before its stylesheet, on every page", async ({ page }) => {
  // Every document gets the override ahead of Ardo's stylesheet, as a site's own
  // CSS would arrive. Ardo's styles sit in a cascade layer, so order cannot matter.
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style")
      style.textContent = ".ardo-footer { background-color: rgb(12, 34, 56); }"
      document.head.prepend(style)
    })
  })
  await page.goto(gettingStartedPath)
  await expect(page.locator(".ardo-footer")).toHaveCSS("background-color", "rgb(12, 34, 56)")
  await page.locator(`a[href="${docsBasePath}/guide/markdown/"]`).first().click()
  await expect(page).toHaveURL(new RegExp(`${docsBasePath}/guide/markdown/$`))
  await expect(page.locator(".ardo-footer")).toHaveCSS("background-color", "rgb(12, 34, 56)")
})
