import { expect, test, type Page } from "@playwright/test"

async function failOnClient(page: Page, failure: string) {
  await page.addInitScript((value) => Reflect.set(globalThis, "__ardoFailure", value), failure)
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const errors: string[] = []
    Reflect.set(globalThis, "__ardoReportedErrors", errors)
    Reflect.set(globalThis, "reportError", (error: unknown) => {
      errors.push(error instanceof Error ? error.message : String(error))
    })
  })
})

async function expectDiagnostic(page: Page, message: string) {
  await expect
    .poll(() => page.evaluate(() => Reflect.get(globalThis, "__ardoReportedErrors")))
    .toEqual([message])
}

for (const failure of ["module", "metadata"]) {
  test(`${failure} failure preserves static content with usable native recovery`, async ({
    page,
  }) => {
    await failOnClient(page, failure)
    await page.goto("/recover/en/")
    const recovery = page.locator('[data-ardo-recovery="static"]')
    await expect(recovery).toBeVisible()
    await expectDiagnostic(
      page,
      failure === "module" ? "Private import error" : "Private metadata error"
    )
    await expect(page.getByRole("heading", { name: "Readable static content" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Native page link" })).toBeVisible()
    await expect(recovery.getByRole("heading")).toBeFocused()
    await expect(page.locator("body")).not.toContainText("Private")
    await page.keyboard.press("Tab")
    await expect(recovery.getByRole("button", { name: "Reload page" })).toBeFocused()
    await page.keyboard.press("Tab")
    await expect(recovery.getByRole("link", { name: "Back to home" })).toBeFocused()
    await expect(recovery.getByRole("link")).toHaveAttribute("href", /\/recover\/en\/$/)
  })
}

test("a catalog/customization failure still provides German controls without recursion", async ({
  page,
}) => {
  await failOnClient(page, "catalog")
  await page.goto("/recover/de/")
  await expect(page.locator("html")).toHaveAttribute("lang", "de")
  const recovery = page.locator("[data-ardo-recovery]")
  await expect(recovery).toHaveAttribute("lang", "de")
  await expect(recovery.getByRole("heading")).toHaveText(
    "Diese Seite konnte nicht gestartet werden"
  )
  await expect(recovery.getByRole("button", { name: "Seite neu laden" })).toBeVisible()
  await expect(recovery.getByRole("link", { name: "Zur Startseite" })).toHaveAttribute(
    "href",
    /\/recover\/de\/$/
  )
  await expect(page.locator("body")).not.toContainText("Private")
  await page.keyboard.press("Tab")
  await expect(recovery.getByRole("button", { name: "Seite neu laden" })).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(recovery.getByRole("link", { name: "Zur Startseite" })).toBeFocused()
  await Promise.all([page.waitForEvent("domcontentloaded"), page.keyboard.press("Enter")])
  await expect(page.locator("html")).toHaveAttribute("lang", "de")
  await expect(recovery.getByRole("button", { name: "Seite neu laden" })).toBeVisible()
})

test("fatal hydration renders an independent localized fallback", async ({ page }, testInfo) => {
  await failOnClient(page, "hydrate")
  await page.goto("/recover/de/")
  const recovery = page.locator('[data-ardo-recovery="fatal"]')
  await expect(recovery).toBeVisible()
  await expectDiagnostic(page, "Private render error")
  await expect(page.getByRole("heading", { name: "Readable static content" })).toHaveCount(0)
  await expect(recovery.getByRole("heading")).toBeFocused()
  await expect(recovery.getByRole("button", { name: "Seite neu laden" })).toBeVisible()
  if (testInfo.project.name === "custom") {
    await expect(recovery).toHaveClass("site-recovery")
    await expect(recovery.getByRole("heading")).toHaveText("Die Website braucht einen Neustart")
  }
  await expect(page.locator("body")).not.toContainText("Private")
  await page.screenshot({ path: testInfo.outputPath("fatal-recovery.png"), fullPage: true })
})

test("a post-hydration render exception replaces the failed page", async ({ page }) => {
  await page.goto("/recover/en/")
  await page.getByRole("button", { name: "Count: 0" }).click()
  await expect(page.getByRole("button", { name: "Count: 1" })).toBeVisible()
  await page.getByRole("button", { name: "Break page" }).click()
  const recovery = page.locator('[data-ardo-recovery="fatal"]')
  await expect(recovery).toBeVisible()
  await expect(recovery.getByRole("heading")).toBeFocused()
  // Recover only on user action. A reload brings the working static page back.
  await page.waitForLoadState("networkidle")
  await expect(recovery).toBeVisible()
  await expectDiagnostic(page, "Private render error")
  await recovery.getByRole("button", { name: "Reload page" }).click()
  await expect(page.getByRole("button", { name: "Count: 0" })).toBeVisible()
  await expect(recovery).toHaveCount(0)
})

test("broken custom chrome cannot hide recovery", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "custom", "Only the custom root owns a chrome control")
  await page.goto("/recover/en/")
  await page.getByRole("button", { name: "Break chrome" }).click()
  await expect(page.locator('[data-ardo-recovery="fatal"]')).toBeVisible()
  await expect(page.locator("[data-custom-chrome]")).toHaveCount(0)
  await expectDiagnostic(page, "Private chrome error")
})

test("recoverable hydration mismatch keeps the interactive page", async ({ page }) => {
  await failOnClient(page, "mismatch")
  await page.goto("/recover/en/")
  await expect(page.getByText("Client content", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Count: 0" }).click()
  await expect(page.getByRole("button", { name: "Count: 1" })).toBeVisible()
  await expect(page.locator("[data-ardo-recovery]")).toHaveCount(0)
})

test("missing bootstrap leaves readable HTML and working native links", async ({ page }) => {
  let blocked = 0
  await page.route("**/assets/entry-client-*.js", (route) => {
    blocked += 1
    return route.abort()
  })
  await page.goto("/recover/en/")
  await expect(page.getByRole("heading", { name: "Readable static content" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Native page link" })).toBeVisible()
  expect(blocked).toBeGreaterThan(0)
  await page.getByRole("button", { name: "Count: 0" }).click()
  await expect(page.getByRole("button", { name: "Count: 0" })).toBeVisible()
  await expect(page.locator("[data-ardo-recovery]")).toHaveCount(0)
})

test("a throwing diagnostic hook cannot hide native recovery", async ({ page }) => {
  await page.addInitScript(() => {
    Reflect.set(globalThis, "reportError", () => {
      throw new Error("Private diagnostic hook error")
    })
  })
  await failOnClient(page, "module")
  await page.goto("/recover/en/")
  await expect(page.locator('[data-ardo-recovery="static"]')).toBeVisible()
  await expect(page.getByRole("button", { name: "Reload page" })).toBeVisible()
  await expect(page.locator("body")).not.toContainText("Private")
})
