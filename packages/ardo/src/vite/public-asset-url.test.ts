import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, expect, it } from "vitest"

import { isPublicAssetUrl } from "./public-asset-url"

const root = mkdtempSync(path.join(os.tmpdir(), "ardo-public-url-"))
afterEach(() => rmSync(root, { recursive: true, force: true }))

it("accepts only unchanged public URLs backed by existing canonical files in publicDir", () => {
  const publicDir = path.join(root, "custom-public")
  mkdirSync(path.join(publicDir, "pdfs"), { recursive: true })
  const file = path.join(publicDir, "pdfs/profile.pdf")
  writeFileSync(file, "%PDF-1.4")
  expect(isPublicAssetUrl("/pdfs/profile.pdf", "/pdfs/profile.pdf", publicDir)).toBe(true)
  expect(isPublicAssetUrl("/pdfs/profile.pdf", file, publicDir)).toBe(false)
  expect(isPublicAssetUrl("/pdfs/missing.pdf", "/pdfs/missing.pdf", publicDir)).toBe(false)
  expect(isPublicAssetUrl("/pdfs", "/pdfs", publicDir)).toBe(false)
  expect(isPublicAssetUrl("/pdfs/profile.pdf", "/pdfs/profile.pdf", "")).toBe(false)
  const outside = path.join(root, "outside.pdf")
  writeFileSync(outside, "%PDF-1.4")
  symlinkSync(outside, path.join(publicDir, "escape.pdf"))
  expect(isPublicAssetUrl("/escape.pdf", "/escape.pdf", publicDir)).toBe(false)
  expect(isPublicAssetUrl("/../outside.pdf", "/../outside.pdf", publicDir)).toBe(false)
  expect(isPublicAssetUrl(outside, outside, publicDir)).toBe(false)
})
