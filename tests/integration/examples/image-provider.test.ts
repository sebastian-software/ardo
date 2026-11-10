import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { afterEach, expect, it } from "vitest"
import { createTestProject } from "./project"
import { assertDevSSR } from "./dev-server"

const directories: string[] = []
afterEach(() => {
  for (const directory of directories.splice(0))
    fs.rmSync(directory, { recursive: true, force: true })
})
function project(provider: boolean) {
  const directory = fs.realpathSync(createTestProject("publication"))
  directories.push(directory)
  const config = path.join(directory, "ardo.config.ts")
  fs.writeFileSync(
    config,
    fs
      .readFileSync(config, "utf8")
      .replace(
        'title: "Publication example",',
        `title: "Publication example",
  images: { widths: [96, 192], ${
    provider
      ? `provider: {
    source({ sha256, extension }) {
      console.info("fixture:image-source:" + sha256)
      return { fileName: "images/" + sha256 + "." + extension, url: "https://cdn.example.test/" + sha256 + "." + extension }
    },
    url({ source, width, height, crop, kind }) {
      return { url: source + "?rect=" + [crop.left, crop.top, crop.width, crop.height].join(",") + "&width=" + width + "&height=" + height + "&kind=" + kind, type: kind === "fallback" ? "image/jpeg" : "image/webp" }
    }
  }`
      : ""
  } },`
      )
      .replace('name: "Alex Morgan",', 'name: "Alex Morgan", avatar: "./posts/scene.png",')
  )
  fs.writeFileSync(
    path.join(directory, "app/routes/notes.md"),
    `---
title: Image notes
images:
  ../../posts/scene.png:
    core: { x: 0.68, y: 0.45, size: 0.3 }
---

![A shared scene](../../posts/scene.png)
`
  )
  fs.writeFileSync(
    path.join(directory, "app/routes/mdx-images.mdx"),
    `---\ntitle: MDX images\n---\n\n<Image src="../../posts/scene.png" alt="MDX shared" />\n`
  )
  return directory
}
it("uses one emitted full-hash original for a cover, body, avatar and ordinary Markdown page", () => {
  const directory = project(true)
  const log = execFileSync(
    "pnpm",
    ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "build"],
    {
      cwd: directory,
      stdio: "pipe",
      timeout: 120_000,
    }
  )
  expect(String(log).match(/fixture:image-source:/gu)).toHaveLength(3)
  const output = path.join(directory, "build/client")
  const original = fs.readFileSync(path.join(directory, "posts/scene.png"))
  const hash = createHash("sha256").update(original).digest("hex")
  expect(fs.readdirSync(path.join(output, "images"))).toEqual([`${hash}.png`])
  expect(fs.readFileSync(path.join(output, `images/${hash}.png`))).toEqual(original)
  expect(fs.existsSync(path.join(output, "assets/posts"))).toBe(false)
  for (const route of ["news/reading", "notes", "mdx-images"]) {
    const html = fs.readFileSync(path.join(output, route, "index.html"), "utf8")
    expect(html).toContain('type="image/webp"')
    expect(html).not.toContain('type="image/avif"')
    expect(html).toContain(`https://cdn.example.test/${hash}.png?rect=`)
    expect(html).toContain("&amp;kind=fallback")
    expect(html).toContain("<picture>")
  }
  const post = fs.readFileSync(path.join(output, "news/reading/index.html"), "utf8")
  expect(post).toMatch(/<img[^>]+src="https:\/\/cdn.example.test\/[^"]+kind=rendition"/u)
  expect(post).toMatch(/og:image[^>]+https:\/\/cdn.example.test\/[^>]+kind=fallback/u)
  for (const name of ["atom.xml", "rss.xml"]) {
    const feed = fs.readFileSync(path.join(output, "news", name), "utf8")
    expect(feed).toContain(`https://cdn.example.test/${hash}.png?rect=`)
    expect(feed).toContain("kind=fallback")
    expect(feed).not.toContain("kind=rendition")
  }
})
it("keeps opted-in Markdown and publication images local in development", async () => {
  const directory = project(true)
  await assertDevSSR(directory, {
    pathname: "/project/news/interactive",
    title: "An example that responds",
    pages: [
      {
        pathname: "/project/news/reading",
        contains: ["/project/assets/posts/", 'type="image/avif"'],
      },
    ],
    afterFirstResponse: async ({ origin }) => {
      const html = await (await fetch(origin + "/project/notes")).text()
      expect(html).toContain("/project/assets/posts/")
      expect(html).not.toContain("cdn.example.test")
      const source = /src="(\/project\/assets\/posts\/[^"]+\.jpg)"/u.exec(html)?.[1]
      expect(source).toBeDefined()
      const response = await fetch(origin + source)
      expect(response.status).toBe(200)
      expect(response.headers.get("content-type")).toContain("image/jpeg")
    },
  })
})

function emitOriginal(directory: string, identical: boolean, hook = "buildStart") {
  fs.writeFileSync(
    path.join(directory, "vite.config.ts"),
    `import { readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { defineConfig } from "ardo/vite"
export default defineConfig({ plugins: [{ name: "fixture:shared-original", enforce: "post", ${hook}() {
  if (this.environment.name !== "client") return
  const original = readFileSync("posts/scene.png")
  const hash = createHash("sha256").update(original).digest("hex")
  this.emitFile({ type: "asset", fileName: "images/" + hash + ".png", source: ${identical ? "original" : 'Buffer.from("different bytes")'} })
} }] })`
  )
}

it("deduplicates a byte-identical original emitted by a site's Vite plugin", () => {
  const directory = project(true)
  emitOriginal(directory, true)
  execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "build"], {
    cwd: directory,
    stdio: "pipe",
    timeout: 120_000,
  })
  expect(fs.readdirSync(path.join(directory, "build/client/images"))).toHaveLength(1)
})
it("rejects a differing asset already emitted at the original's path", () => {
  const directory = project(true)
  emitOriginal(directory, false)
  let output = ""
  try {
    execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "build"], {
      cwd: directory,
      stdio: "pipe",
      timeout: 120_000,
    })
  } catch (error) {
    output = String((error as { stderr?: Buffer }).stderr)
  }
  expect(output).toContain("image output collides")
})
it("keeps publication.images compatible without opting ordinary documents in", () => {
  const directory = project(true)
  const config = path.join(directory, "ardo.config.ts")
  let source = fs.readFileSync(config, "utf8")
  const start = source.indexOf("  images:")
  const end = source.indexOf("  base:", start)
  const images = source.slice(start, end)
  source = (source.slice(0, start) + source.slice(end)).replace(
    'linkCheck: { level: "error" }',
    'linkCheck: { level: "ignore" }'
  )
  fs.writeFileSync(config, source.replace("  publication: {", "  publication: {\n" + images))
  execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "build"], {
    cwd: directory,
    stdio: "pipe",
    timeout: 120_000,
  })
  const output = path.join(directory, "build/client")
  const notes = fs.readFileSync(path.join(output, "notes/index.html"), "utf8")
  expect(notes).toContain('src="../../posts/scene.png"')
  expect(notes).not.toContain("<picture>")
  expect(fs.readFileSync(path.join(output, "news/reading/index.html"), "utf8")).toContain(
    'type="image/webp"'
  )
})
it("serves ordinary image output from deploymentBase in a fully versioned dev site", async () => {
  const directory = fs.realpathSync(createTestProject())
  directories.push(directory)
  fs.copyFileSync(
    path.join(import.meta.dirname, "../../fixtures/publication/posts/scene.png"),
    path.join(directory, "app/routes/scene.png")
  )
  fs.writeFileSync(
    path.join(directory, "ardo.config.ts"),
    `import { defineArdoConfig } from "ardo/config"
export default defineArdoConfig({ title: "Versioned images", base: "/project/", images: { widths: [96] }, versioning: { current: "v6", versions: [{ id: "v6", path: "/v6/" }] } })`
  )
  fs.writeFileSync(
    path.join(directory, "app/routes/photos.md"),
    `---\ntitle: Photos\n---\n\nCount: 0\n\n![Local scene](./scene.png)\n`
  )
  await assertDevSSR(directory, {
    pathname: "/project/v6/photos",
    title: "Photos",
    afterFirstResponse: async ({ origin, html }) => {
      const source = /src="(\/project\/assets\/posts\/[^"]+\.jpg)"/u.exec(html)?.[1]
      expect(source).toBeDefined()
      expect((await fetch(origin + source)).status).toBe(200)
    },
  })
})
it("resolves images beside canonical materialized sources with normalized mapping targets", () => {
  const directory = project(true)
  fs.mkdirSync(path.join(directory, "content"))
  fs.copyFileSync(
    path.join(directory, "posts/scene.png"),
    path.join(directory, "content/scene.png")
  )
  fs.writeFileSync(
    path.join(directory, "content/mapped.md"),
    "# Mapped image\n\n![Canonical source image](./scene.png)\n"
  )
  const config = path.join(directory, "ardo.config.ts")
  fs.writeFileSync(
    config,
    fs
      .readFileSync(config, "utf8")
      .replace(
        'title: "Publication example",',
        `title: "Publication example", content: [{ from: "content", to: "/gallery" }, { from: "content", to: "other\\\\pictures" }],`
      )
  )
  execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "build"], {
    cwd: directory,
    stdio: "pipe",
    timeout: 120_000,
  })
  const output = path.join(directory, "build/client")
  for (const route of ["gallery/mapped", "other/pictures/mapped"]) {
    const html = fs.readFileSync(path.join(output, route, "index.html"), "utf8")
    expect(html).toContain('type="image/webp"')
    expect(html).toContain('alt="Canonical source image"')
  }
  expect(fs.readdirSync(path.join(output, "images"))).toHaveLength(1)
})

it("emits an identical public original when copying publicDir is disabled", () => {
  const directory = project(true)
  const original = fs.readFileSync(path.join(directory, "posts/scene.png"))
  const hash = createHash("sha256").update(original).digest("hex")
  fs.mkdirSync(path.join(directory, "public/images"), { recursive: true })
  fs.writeFileSync(path.join(directory, `public/images/${hash}.png`), original)
  fs.writeFileSync(
    path.join(directory, "vite.config.ts"),
    `import { defineConfig } from "ardo/vite"
export default defineConfig({ build: { copyPublicDir: false } })`
  )
  execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "build"], {
    cwd: directory,
    stdio: "pipe",
    timeout: 120_000,
  })
  expect(fs.readFileSync(path.join(directory, `build/client/images/${hash}.png`))).toEqual(original)
})

it("deduplicates an original emitted by a later generateBundle hook", () => {
  const directory = project(true)
  emitOriginal(directory, true, "generateBundle")
  execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "build"], {
    cwd: directory,
    stdio: "pipe",
    timeout: 120_000,
  })
  expect(fs.readdirSync(path.join(directory, "build/client/images"))).toHaveLength(1)
})
it("rejects differing bytes from a later generateBundle hook", () => {
  const directory = project(true)
  emitOriginal(directory, false, "generateBundle")
  let output = ""
  try {
    execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "build"], {
      cwd: directory,
      stdio: "pipe",
      timeout: 120_000,
    })
  } catch (error) {
    output = String((error as { stderr?: Buffer }).stderr)
  }
  expect(output).toContain("image output collides")
})
