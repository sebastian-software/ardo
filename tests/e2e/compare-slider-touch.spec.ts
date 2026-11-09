import { expect, test } from "@playwright/test"
import type { CDPSession, Page } from "@playwright/test"

// A phone: touch input and a coarse pointer, so react-compare-slider lets only the handle drag.
test.use({
  viewport: { width: 412, height: 915 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
})

const galleryPath = "/v6/en/guide/components/"

type Point = { x: number; y: number }

/** Drags one finger from `from` to `to` through Chromium's touch input, as a phone would. */
async function touchDrag(cdp: CDPSession, from: Point, to: Point, steps = 12) {
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [from] })
  for (let step = 1; step <= steps; step += 1) {
    const point = {
      x: from.x + ((to.x - from.x) * step) / steps,
      y: from.y + ((to.y - from.y) * step) / steps,
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [point] })
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
}

/**
 * How far the page has scrolled. Ardo's default viewport scroll mode scrolls a container, not the
 * window, so this reads the comparison's nearest scrolling ancestor.
 */
function pageScroll(page: Page) {
  return page.evaluate(() => {
    let element = document.querySelector("#gallery-compare-slider")?.parentElement
    while (element && element !== document.body) {
      const { overflowY } = getComputedStyle(element)
      if (/auto|scroll/u.test(overflowY) && element.scrollHeight > element.clientHeight) {
        return element.scrollTop
      }
      element = element.parentElement
    }
    return window.scrollY
  })
}

async function openGallerySlider(page: Page) {
  await page.goto(galleryPath)
  const compare = page.locator("#gallery-compare-slider")
  await compare.scrollIntoViewIfNeeded()
  const slider = compare.getByRole("slider", {
    name: "Hero illustration: Light left of the divider, Dark right of it",
    exact: true,
  })
  await expect(slider).toHaveAttribute("aria-valuenow", "50")
  const cdp = await page.context().newCDPSession(page)
  return { compare, slider, cdp }
}

test.skip(
  ({ browserName }) => browserName !== "chromium",
  "Touch input goes through Chromium's CDP"
)

test("compare slider handle follows a finger on a touch screen", async ({ page }) => {
  const { compare, slider, cdp } = await openGallerySlider(page)
  const handle = await compare.locator(".__rcs-handle-button").boundingBox()
  if (!handle) throw new Error("Expected the compare slider handle to be laid out")
  const center = { x: handle.x + handle.width / 2, y: handle.y + handle.height / 2 }

  await touchDrag(cdp, center, { x: center.x + 90, y: center.y })

  await expect
    .poll(async () => Number(await slider.getAttribute("aria-valuenow")))
    .toBeGreaterThan(70)
})

test("a vertical swipe over the comparison scrolls the page and leaves the divider", async ({
  page,
}) => {
  const { compare, slider, cdp } = await openGallerySlider(page)
  const stage = await compare.locator('[data-rcs="root"]').boundingBox()
  if (!stage) throw new Error("Expected the compare slider to be laid out")
  const scrollBefore = await pageScroll(page)
  // Well left of the handle, inside the first view.
  const start = { x: stage.x + stage.width * 0.15, y: stage.y + stage.height * 0.7 }

  await touchDrag(cdp, start, { x: start.x, y: start.y - 250 })

  await expect.poll(() => pageScroll(page)).toBeGreaterThan(scrollBefore + 100)
  await expect(slider).toHaveAttribute("aria-valuenow", "50")
})
