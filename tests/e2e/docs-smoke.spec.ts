import { expect, test } from "@playwright/test"

const docsBasePath = "/v6"
const gettingStartedPath = `${docsBasePath}/guide/getting-started`

test("versioned agent onboarding is available in HTML and machine-readable documentation", async ({
  page,
  request,
}) => {
  await page.goto(gettingStartedPath)
  await page.getByRole("link", { name: "Agent Instructions", exact: true }).last().click()
  await expect(page).toHaveURL(`${docsBasePath}/guide/agent-instructions`)
  await expect(page.getByRole("heading", { level: 1, name: "Agent Instructions" })).toBeVisible()

  const index = await request.get(`${docsBasePath}/llms.txt`)
  expect(index.ok()).toBe(true)
  expect(await index.text()).toContain("https://ardo-docs.dev/v6/guide/agent-instructions")
  expect(await index.text()).toContain("https://ardo-docs.dev/v6/llms-full.txt")
  const full = await request.get(`${docsBasePath}/llms-full.txt`)
  expect(full.ok()).toBe(true)
  const instructions = await full.text()
  expect(instructions).toContain("## Match the Version First")
  expect(instructions).toContain("examples/basic")
  for (const removed of ["library", "monorepo", "content-sources", "github-pages"]) {
    expect(instructions).not.toContain(`examples/${removed}`)
  }

  await page.goto(`${docsBasePath}/guide/reference-projects`)
  await expect(page.getByRole("heading", { level: 1, name: "Basic Example" })).toBeVisible()
  await expect(page.getByRole("heading", { level: 2, name: "Multiple Packages" })).toBeVisible()
})

test("built docs site hydrates and supports search and theme interactions", async ({ page }) => {
  const consoleErrors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text())
    }
  })

  await page.goto(gettingStartedPath)

  await expect(page.getByRole("heading", { level: 1, name: "Getting Started" })).toBeVisible()

  await page.getByRole("button", { name: /Switch to .* theme/ }).click()
  await expect(page.locator("html")).toHaveClass(/light|dark/)

  const searchInput = page.getByRole("combobox", { name: "Search" }).last()
  await searchInput.fill("markdown")
  await expect(page.getByRole("option", { name: /Markdown/ }).first()).toBeVisible()
  await searchInput.press("Enter")
  await expect(page).toHaveURL(/\/v6\/guide\/configuration#markdown$/)

  expect(consoleErrors.filter((message) => !message.includes("favicon"))).toEqual([])
})

test("mobile docs navigation opens as a dialog and restores route navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto(gettingStartedPath)

  await expect(page.getByRole("heading", { level: 1, name: "Getting Started" })).toBeVisible()
  await page.getByRole("banner").last().getByRole("button", { name: "Toggle menu" }).click()
  const menu = page.getByRole("dialog", { name: /Ardo navigation menu/ })
  await expect(menu).toBeVisible()

  await menu.getByRole("link", { name: "Markdown Features" }).click()

  await expect(page).toHaveURL(/\/v6\/guide\/markdown/)
  await expect(menu).toBeHidden()
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

test("consumer CSS overrides Ardo even before its stylesheet and after navigation", async ({
  page,
}) => {
  await page.goto(gettingStartedPath)
  const override = await page.addStyleTag({
    content: ".ardo-footer { background-color: rgb(12, 34, 56); }",
  })
  await override.evaluate((element) => document.head.prepend(element))
  await expect(page.locator(".ardo-footer")).toHaveCSS("background-color", "rgb(12, 34, 56)")
  await page.locator(`a[href="${docsBasePath}/guide/markdown"]`).first().click()
  await expect(page).toHaveURL(new RegExp(`${docsBasePath}/guide/markdown$`))
  await expect(page.locator(".ardo-footer")).toHaveCSS("background-color", "rgb(12, 34, 56)")
})
