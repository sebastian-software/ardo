import { expect, test } from "@playwright/test"

const languages = [
  {
    id: "en",
    language: "Language",
    search: "Search",
    title: "Internationalization",
    zero: "0 clicks",
    one: "1 click",
    two: "2 clicks",
    menu: "Toggle menu",
    query: "Configuration",
  },
  {
    id: "de",
    language: "Sprache",
    search: "Suche",
    title: "Internationalisierung",
    zero: "0 Klicks",
    one: "1 Klick",
    two: "2 Klicks",
    menu: "Menü umschalten",
    query: "Konfiguration",
  },
  {
    id: "fr",
    language: "Langue",
    search: "Recherche",
    title: "Internationalisation",
    zero: "0 clic",
    one: "1 clic",
    two: "2 clics",
    menu: "Afficher ou masquer le menu",
    query: "Configuration",
  },
  {
    id: "es",
    language: "Idioma",
    search: "Buscar",
    title: "Internacionalización",
    zero: "0 clics",
    one: "1 clic",
    two: "2 clics",
    menu: "Mostrar u ocultar el menú",
    query: "Configuración",
  },
] as const

for (const language of languages) {
  test(`${language.id} renders translated MDX before JavaScript and hydrates its plural counter`, async ({
    page,
    browser,
    baseURL,
  }) => {
    const pathname = `/v6/${language.id}/guide/internationalization/`
    const staticContext = await browser.newContext({ javaScriptEnabled: false, baseURL })
    try {
      const staticPage = await staticContext.newPage()
      await staticPage.goto(pathname)
      await expect(staticPage.locator("html")).toHaveAttribute("lang", language.id)
      await expect(
        staticPage.getByRole("heading", { level: 1, name: language.title })
      ).toBeVisible()
      await expect(
        staticPage.getByRole("button", { name: language.zero, exact: true })
      ).toBeVisible()
      await expect(staticPage.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `https://ardo-docs.dev${pathname.slice(0, -1)}`
      )
      for (const alternative of languages) {
        await expect(
          staticPage.locator(`link[rel="alternate"][hreflang="${alternative.id}"]`)
        ).toHaveAttribute(
          "href",
          `https://ardo-docs.dev/v6/${alternative.id}/guide/internationalization`
        )
      }
    } finally {
      await staticContext.close()
    }

    const catalogRequests: string[] = []
    page.on("request", (request) => {
      if (request.url().includes("/palamedes-m-")) catalogRequests.push(request.url())
    })
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text())
    })
    await page.goto(pathname)
    await page.getByRole("button", { name: language.zero, exact: true }).click()
    await page.getByRole("button", { name: language.one, exact: true }).click()
    await expect(page.getByRole("button", { name: language.two, exact: true })).toBeVisible()
    expect(errors).toEqual([])
    expect(catalogRequests.length).toBeGreaterThan(0)
    expect(catalogRequests.every((url) => url.includes(`.${language.id}-`))).toBe(true)
  })

  test(`${language.id} downloads only its own search index and keeps result links localized`, async ({
    page,
  }) => {
    const indexes: string[] = []
    page.on("request", (request) => {
      if (/search-index_locale_/.test(request.url())) indexes.push(request.url())
    })
    await page.goto(`/v6/${language.id}/guide/getting-started/`)
    expect(indexes).toEqual([])
    await page.getByRole("combobox", { name: language.search, exact: true }).fill(language.query)
    const results = page.getByRole("listbox").getByRole("option")
    await expect(results.first()).toBeVisible()
    for (const href of await results.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("href"))
    )) {
      expect(href).toMatch(new RegExp(`^/v6/${language.id}/`))
    }
    expect(indexes).toHaveLength(1)
    expect(indexes[0]).toContain(`search-index_locale_${language.id}-`)
    await results.first().click()
    await expect(page).toHaveURL(new RegExp(`/v6/${language.id}/`))
    await expect(page.locator("html")).toHaveAttribute("lang", language.id)
  })
}

test("language switching retains the article, query and stable heading anchor", async ({
  page,
}) => {
  await page.goto("/v6/en/guide/internationalization/?example=1#static-language-routes")
  for (const [index, language] of languages.entries()) {
    const next = languages[(index + 1) % languages.length]
    await page.getByRole("combobox", { name: language.language, exact: true }).selectOption(next.id)
    await expect(page).toHaveURL(
      new RegExp(`/v6/${next.id}/guide/internationalization/\\?example=1#static-language-routes$`)
    )
    await expect(page.locator("#static-language-routes")).toBeInViewport()
    await expect(page.locator("html")).toHaveAttribute("lang", next.id)
  }
})

test("mobile language controls and the logo retain the selected language without overflow", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/v6/de/guide/internationalization/")
  await page
    .getByRole("banner")
    .last()
    .getByRole("button", { name: "Menü umschalten", exact: true })
    .click()
  await page
    .getByRole("dialog")
    .getByRole("combobox", { name: "Sprache", exact: true })
    .selectOption("es")
  await expect(page).toHaveURL(/\/v6\/es\/guide\/internationalization\/$/)
  await page
    .getByRole("banner")
    .last()
    .getByRole("link", { name: /^Ardo(?: Ardo)?$/, exact: true })
    .click()
  await expect(page).toHaveURL(/\/v6\/es\/$/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await expect(page.getByRole("link", { name: "Empieza", exact: true })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath("spanish-home-mobile.png"), fullPage: false })
})

test("legacy links preserve query and fragment, and older versions drop the locale prefix", async ({
  page,
}) => {
  await page.goto("/v6/guide/getting-started/?from=legacy#production-build")
  await expect(page).toHaveURL(/\/v6\/en\/guide\/getting-started\/\?from=legacy#production-build$/)
  await page.goto("/v6/de/guide/getting-started/?from=version#production-build")
  await page.getByRole("combobox", { name: "Version", exact: true }).selectOption("v5")
  await expect(page).toHaveURL(/\/v5\/guide\/getting-started\/\?from=version#production-build$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "Getting Started", exact: true })
  ).toBeVisible()
})

for (const language of languages) {
  test(`${language.id} homepage fits narrow and wide viewports`, async ({ page }, testInfo) => {
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto(`/v6/${language.id}/`)
      await expect(page.locator("html")).toHaveAttribute("lang", language.id)
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width
      )
      if (language.id === "de" && width === 1440) {
        await page.screenshot({ path: testInfo.outputPath("german-home-desktop.png") })
      }
    }
  })
}

test("a failed catalog offers document reload and recovers the translated page", async ({
  page,
}) => {
  const catalog = "**/palamedes-m-*.de-*.js"
  await page.route(catalog, (route) => route.abort())
  await page.goto("/v6/de/guide/internationalization/")
  await expect(page.getByRole("alert")).toBeVisible()
  const reload = page.getByRole("link", { name: "Reload page", exact: true })
  await expect(reload).toHaveAttribute("target", "_self")

  await page.unroute(catalog)
  await reload.click()
  await expect(page.getByRole("heading", { level: 1, name: "Internationalisierung" })).toBeVisible()
  await page.getByRole("button", { name: "0 Klicks", exact: true }).click()
  await expect(page.getByRole("button", { name: "1 Klick", exact: true })).toBeVisible()
})

test("PO-backed German guides retain interactive components and source edit links", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/v6/de/guide/components/")
  await expect(
    page.getByRole("heading", { level: 1, name: "Komponenten", exact: true })
  ).toBeVisible()
  await expect(
    page.locator("#gallery-hero").getByRole("link", { name: "Guide lesen", exact: true })
  ).toHaveAttribute("href", "/v6/de/guide/getting-started/")
  await expect(
    page.locator("#gallery-hero").getByRole("link", { name: "Quellcode ansehen", exact: true })
  ).toBeVisible()
  await page.locator("#gallery-tabs").getByRole("tab", { name: "npm", exact: true }).click()
  await expect(
    page.locator("#gallery-tabs").getByRole("tabpanel", { name: "npm", exact: true })
  ).toContainText("npm install ardo")
  await page
    .locator("#gallery-accordion")
    .getByRole("button", { name: "Kann ich React-Komponenten verwenden?", exact: true })
    .click()
  await expect(
    page
      .locator("#gallery-accordion")
      .getByRole("region", { name: "Kann ich React-Komponenten verwenden?", exact: true })
  ).toBeVisible()
  const editLinks = page.locator(
    'a[href="https://github.com/sebastian-software/ardo/edit/main/docs/app/content/guide/components.mdx"]'
  )
  await expect(editLinks.first()).toBeVisible()
  expect(errors).toEqual([])
})

test("PO-backed guides keep localized metadata, outlines, search, and LLM text", async ({
  page,
  request,
}) => {
  await page.goto("/v6/de/guide/internationalization/")
  await expect(page).toHaveTitle("Internationalisierung | Ardo")
  await expect(page.getByRole("link", { name: "Layout und Navigation", exact: true })).toBeVisible()
  await expect(page.getByRole("link", { name: "Theming", exact: true })).toBeVisible()
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /Eine englische MDX-Quelle/
  )
  await expect(page.locator('a[href="#static-language-routes"]').first()).toHaveText(
    "Statische Sprachrouten"
  )
  await expect(page.locator("#static-language-routes")).toHaveText("Statische Sprachrouten")
  await page.getByRole("combobox", { name: "Suche", exact: true }).fill("PO-Kataloge")
  await expect(page.getByRole("listbox").getByRole("option").first()).toBeVisible()
  const exports = await request.get("/v6/llms-full.txt")
  expect(exports.ok()).toBe(true)
  const text = await exports.text()
  expect(text).toContain("Gepflegt werden nur die englische MDX-Quelle")
  expect(text).toContain("https://ardo-docs.dev/v6/de/guide/internationalization/")
  expect(text).toContain("app/content/guide/")
})
