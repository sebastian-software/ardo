import { describe, expect, it } from "vitest"

import { resolveConfig } from "../config"
import { resolveLlmsContentLinks } from "./llms-links"

const config = resolveConfig(
  {
    title: "Docs",
    siteUrl: "https://example.com",
    base: "/docs/",
    versioning: {
      current: "v6",
      versions: [
        { id: "v6", path: "/v6/" },
        { id: "v5", path: "/v5/" },
      ],
    },
  },
  "/tmp"
)
const page = { publicPath: "/docs/v6/guide/setup", routePath: "/guide/setup" }

function links(content: string) {
  return resolveLlmsContentLinks(content, page, config)
}

describe("LLM content hyperlinks", () => {
  it("resolves root, relative, query, and fragment links from their original page", () => {
    expect(
      links(
        "[root](/guide/start#install) [sibling](intro) [parent](../api) [fragment](#manual-installation) [query](?q=1#top)"
      )
    ).toBe(
      "[root](<https://example.com/docs/v6/guide/start/#install>) [sibling](<https://example.com/docs/v6/guide/intro/>) [parent](<https://example.com/docs/v6/api/>) [fragment](<https://example.com/docs/v6/guide/setup#manual-installation>) [query](<https://example.com/docs/v6/guide/setup?q=1#top>)"
    )
  })

  it("does not duplicate a deployment root or current/archived version prefix", () => {
    const input =
      "[current](/docs/v6/guide/start) [old](/docs/v5/guide/start) [root](/docs/robots.txt)"
    expect(links(input)).toBe(
      "[current](<https://example.com/docs/v6/guide/start>) [old](<https://example.com/docs/v5/guide/start>) [root](<https://example.com/docs/robots.txt>)"
    )
  })

  it("retains authored labels and titles while expanding reference-style links", () => {
    const input =
      'Unicode 🦉 [**Guide** `]`](</guide/with space> "A title") [ref][id] [shortcut]\n\n[id]: ../reference "Ref title"\n[shortcut]: #details'
    const result = links(input)
    expect(result).toContain(
      '[**Guide** `]`](<https://example.com/docs/v6/guide/with%20space/> "A title")'
    )
    expect(result).toContain('[ref](<https://example.com/docs/v6/reference/> "Ref title")')
    expect(result).toContain("[shortcut](<https://example.com/docs/v6/guide/setup#details>)")
  })

  it("leaves external URLs, image URLs, inline code, and fenced code byte-for-byte unchanged", () => {
    const input =
      '[web](https://other.example/a?q=1#h "Title") [mail](mailto:docs@example.com) [cdn](//cdn.example/a) ![image](/logo.svg) `[code](/guide/start)`\n\n~~~md\n[example](/guide/start)  \n\n\n~~~'
    expect(links(input)).toBe(input)
  })

  it("keeps locale context and supports sites without an absolute public URL", () => {
    expect(
      resolveLlmsContentLinks(
        "[next](/guide/next) [here](#details)",
        { ...page, publicPath: "/docs/v6/de/guide/setup" },
        { ...config, siteUrl: "" }
      )
    ).toBe("[next](</docs/v6/de/guide/next/>) [here](</docs/v6/de/guide/setup#details>)")
  })
})
