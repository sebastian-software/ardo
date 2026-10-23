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

test("the default runtime route keeps document scrolling inside the viewport shell", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  // Preview serves routes from their trailing-slash directory URLs.
  const serverResponse = await request.get("/guide/getting-started/")
  expect(serverResponse.ok()).toBe(true)
  const serverHtml = await serverResponse.text()
  expect(serverHtml.match(/id="main-content"/g) ?? []).toHaveLength(1)
  expect(serverHtml).not.toContain("document-scroll-header")

  await page.goto("/guide/getting-started/")

  const main = page.locator("#main-content")
  await expect(main).toHaveCount(1)
  await expect(main).toHaveCSS("overflow-y", "auto")
  const scrollState = await main.evaluate((element) => {
    const filler = document.createElement("div")
    filler.style.height = "200vh"
    filler.style.flex = "none"
    element.append(filler)
    element.scrollTop = element.scrollHeight
    return {
      documentScrollTop: document.scrollingElement?.scrollTop ?? 0,
      mainClientHeight: element.clientHeight,
      mainScrollHeight: element.scrollHeight,
      mainScrollTop: element.scrollTop,
      viewportHeight: window.innerHeight,
    }
  })
  expect(scrollState.mainScrollHeight).toBeGreaterThan(scrollState.mainClientHeight)
  expect(scrollState.mainScrollTop).toBeGreaterThan(0)
  expect(scrollState.documentScrollTop).toBe(0)
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(
    scrollState.viewportHeight + 1
  )
})

test("document scrolling keeps site chrome, the outline, and the footer in the document flow", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  const serverResponse = await request.get("/guide/document-scroll/")
  expect(serverResponse.ok()).toBe(true)
  const serverHtml = await serverResponse.text()
  expect(serverHtml.match(/id="main-content"/g) ?? []).toHaveLength(1)
  expect(serverHtml).toContain("document-scroll-header")
  expect(serverHtml).toContain("document-scroll-custom-layout")

  await page.goto("/guide/document-scroll/")

  const main = page.locator("#main-content")
  const header = page.locator(".document-scroll-header")
  const sidebar = page.locator(".ardo-sidebar")
  const pageRail = page.locator(".ardo-page-rail")
  const layout = page.locator(".document-scroll-custom-layout")
  await expect(main).toHaveCount(1)
  await expect(
    page.getByRole("heading", { level: 1, name: "Document scrolling fixture" })
  ).toBeVisible()
  await expect(header).toBeVisible()
  await expect(layout).toHaveCSS("overflow", "visible")
  await expect(layout).toHaveCSS("display", "flex")
  await expect(page.locator(".ardo-header, .ardo-footer")).toHaveCount(0)
  await expect(sidebar).toBeVisible()
  await expect(pageRail).toBeVisible()
  await expect(main).toHaveCSS("overflow-y", "visible")

  const desktopMetrics = await page.evaluate(() => {
    const sidebarElement = document.querySelector(".ardo-sidebar")
    const railElement = document.querySelector(".ardo-page-rail")
    return {
      documentHeight: document.documentElement.scrollHeight,
      documentWidth: document.documentElement.scrollWidth,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      headerHeight: document.querySelector(".document-scroll-header")?.getBoundingClientRect()
        .height,
      mainTop: document.querySelector("#main-content")?.getBoundingClientRect().top,
      mainRight: document.querySelector("#main-content")?.getBoundingClientRect().right,
      headerOffset: getComputedStyle(document.documentElement)
        .getPropertyValue("--ardo-layout-headerHeight")
        .trim(),
      scrollPadding: getComputedStyle(document.documentElement).scrollPaddingTop,
      sidebarOffset: sidebarElement === null ? undefined : getComputedStyle(sidebarElement).top,
      railOffset: railElement === null ? undefined : getComputedStyle(railElement).top,
      railRight: railElement?.getBoundingClientRect().right,
    }
  })
  expect(desktopMetrics.documentHeight).toBeGreaterThan(desktopMetrics.viewportHeight)
  expect(desktopMetrics.documentWidth).toBeLessThanOrEqual(desktopMetrics.viewportWidth)
  expect(desktopMetrics.headerHeight).toBe(64)
  expect(desktopMetrics.mainTop).toBe(64)
  expect(desktopMetrics.mainRight).toBeLessThanOrEqual(desktopMetrics.viewportWidth)
  expect(desktopMetrics.headerOffset).toBe("4rem")
  expect(desktopMetrics.scrollPadding).toBe("96px")
  expect(desktopMetrics.sidebarOffset).toBe("64px")
  expect(desktopMetrics.railOffset).toBe("96px")
  expect(desktopMetrics.railRight).toBeLessThanOrEqual(desktopMetrics.viewportWidth)

  const skipLink = page.getByRole("link", { name: "Skip to content" })
  await page.keyboard.press("Tab")
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toBeVisible()
  await expect(skipLink).toHaveAttribute("href", "#main-content")

  await page.getByRole("link", { name: "Middle section" }).click()
  await expect(page).toHaveURL(/#middle-section$/)
  await expect(main).toHaveCount(1)
  await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  await expect(page.locator('.ardo-toc a[href="#middle-section"]')).toHaveClass(/active/)

  const desktopScrollState = await page.evaluate(() => ({
    documentScrollTop: document.scrollingElement?.scrollTop ?? 0,
    mainScrollTop: document.querySelector("#main-content")?.scrollTop ?? 0,
    headerBottom:
      document.querySelector(".document-scroll-header")?.getBoundingClientRect().bottom ?? 0,
    headingTop: document.getElementById("middle-section")?.getBoundingClientRect().top ?? 0,
    maxScrollTop: (document.scrollingElement?.scrollHeight ?? 0) - window.innerHeight,
    sidebarTop: document.querySelector(".ardo-sidebar")?.getBoundingClientRect().top ?? 0,
    railTop: document.querySelector(".ardo-page-rail")?.getBoundingClientRect().top ?? 0,
  }))
  expect(desktopScrollState.documentScrollTop).toBeGreaterThan(0)
  expect(desktopScrollState.mainScrollTop).toBe(0)
  expect(desktopScrollState.headingTop).toBeGreaterThanOrEqual(desktopScrollState.headerBottom)
  expect(desktopScrollState.headingTop).toBeLessThanOrEqual(desktopScrollState.headerBottom + 64)
  expect(desktopScrollState.documentScrollTop).toBeLessThan(desktopScrollState.maxScrollTop - 100)
  expect(desktopScrollState.sidebarTop).toBe(64)
  expect(desktopScrollState.railTop).toBe(96)

  await page.getByRole("link", { name: "First section" }).click()
  await expect(page).toHaveURL(/#first-section$/)
  const firstTocLink = page.locator('.ardo-toc a[href="#first-section"]')
  const firstHeading = page.locator("#first-section")
  await expect(firstTocLink).toHaveClass(/active/)
  await expect
    .poll(async () =>
      firstHeading.evaluate((element) => {
        const top = element.getBoundingClientRect().top
        return top >= 64 && top <= 160
      })
    )
    .toBe(true)
  const middleHeadingDelta = await page
    .locator("#middle-section")
    .evaluate((element) => element.getBoundingClientRect().top - 80)
  const scrollBeforeWheel = await page.evaluate(() => window.scrollY)
  await page.mouse.move(700, 400)
  await page.mouse.wheel(0, middleHeadingDelta)
  await expect
    .poll(async () => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(scrollBeforeWheel)
  const middleHeadingTop = await page
    .locator("#middle-section")
    .evaluate((element) => element.getBoundingClientRect().top)
  expect(middleHeadingTop).toBeGreaterThanOrEqual(20)
  expect(middleHeadingTop).toBeLessThanOrEqual(140)
  await expect(page.locator('.ardo-toc a[href="#middle-section"]')).toHaveClass(/active/)
  expect(await header.evaluate((element) => element.getBoundingClientRect().top)).toBe(0)

  const footer = page.getByTestId("external-site-footer")
  await footer.scrollIntoViewIfNeeded()
  await expect(footer).toBeVisible()
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  await expect(header).toHaveCSS("position", "sticky")
  expect(await header.evaluate((element) => element.getBoundingClientRect().top)).toBe(0)
})

test("document mode updates the custom header offset on mobile and keeps anchors clear", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/guide/document-scroll/#middle-section")

  const header = page.locator(".document-scroll-header")
  const main = page.locator("#main-content")
  const heading = page.locator("#middle-section")
  const footer = page.getByTestId("external-site-footer")
  await expect(header).toBeVisible()
  await expect(main).toHaveCount(1)
  await expect(heading).toBeVisible()

  const mobileMetrics = await page.evaluate(() => ({
    documentHeight: document.documentElement.scrollHeight,
    documentWidth: document.documentElement.scrollWidth,
    viewportHeight: window.innerHeight,
    viewportWidth: window.innerWidth,
    headerHeight: document.querySelector(".document-scroll-header")?.getBoundingClientRect().height,
    headerOffset: getComputedStyle(document.documentElement)
      .getPropertyValue("--ardo-layout-headerHeight")
      .trim(),
    scrollPadding: getComputedStyle(document.documentElement).scrollPaddingTop,
    headingTop: document.getElementById("middle-section")?.getBoundingClientRect().top ?? 0,
    headerBottom:
      document.querySelector(".document-scroll-header")?.getBoundingClientRect().bottom ?? 0,
  }))
  expect(mobileMetrics.documentHeight).toBeGreaterThan(mobileMetrics.viewportHeight)
  expect(mobileMetrics.documentWidth).toBeLessThanOrEqual(mobileMetrics.viewportWidth)
  expect(mobileMetrics.headerHeight).toBe(96)
  expect(mobileMetrics.headerOffset).toBe("6rem")
  expect(mobileMetrics.scrollPadding).toBe("128px")
  expect(mobileMetrics.headingTop).toBeGreaterThanOrEqual(mobileMetrics.headerBottom)
  expect(mobileMetrics.headingTop).toBeLessThanOrEqual(mobileMetrics.headerBottom + 64)

  await footer.scrollIntoViewIfNeeded()
  await expect(footer).toBeVisible()
  await expect(header).toHaveCSS("position", "sticky")
  expect(await header.evaluate((element) => element.getBoundingClientRect().top)).toBe(0)
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
})

test.describe("build date hydration", () => {
  test.use({ timezoneId: "America/Los_Angeles" })

  test("keeps the UTC build date when the reader is on the previous calendar day", async ({
    page,
    request,
  }) => {
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    const html = await (await request.get("/")).text()
    expect(html).toContain("January 5, 2026")
    await page.goto("/")
    const counter = page.getByTestId("runtime-counter")
    await expect(counter).toHaveAttribute("data-hydrated", "true")
    await counter.click()
    await expect(counter).toHaveText("Count: 1")
    await expect(page.locator(".ardo-footer")).toContainText("January 5, 2026")
    expect(errors).toEqual([])
  })
})
