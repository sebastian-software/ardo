import type { ImagePreset } from "./types"

export const ardoImagePresets: Record<string, ImagePreset> = {
  article: {
    fallback: "4:3",
    sizes: "(min-width: 52rem) 48rem, 100vw",
    sources: [{ media: "(min-width: 52rem)", composition: "16:10" }],
  },
  card: { fallback: "4:3", sizes: "(min-width: 52rem) 20rem, 100vw" },
}
