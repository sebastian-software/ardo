import type { PreparedJsxDocument } from "ferromark"
import type { ArdoConfig } from "../config/types"
import type { PostImageInput } from "../images/types"
import { prepareNativeMarkdown } from "../markdown/native-metadata"
import { record } from "./post-metadata"

export function collectImageInputs({
  data,
  prepared,
  markdown,
}: {
  data: Record<string, unknown>
  prepared: PreparedJsxDocument
  markdown?: ArdoConfig["markdown"]
}): Map<string, PostImageInput> {
  const metadata = record(data.images, "images")
  const portable = typeof data.feedContent === "string" ? data.feedContent : ""
  const references = [
    ...prepared.collectReferences(),
    ...prepareNativeMarkdown(portable, "md", {
      ...markdown,
      trackReferences: true,
    }).prepared.collectReferences(),
  ]
  const images = new Map<string, PostImageInput>()
  for (const reference of references) {
    if (
      reference.kind !== "image" &&
      !(
        reference.kind === "mdxAttribute" &&
        reference.attribute === "src" &&
        reference.element === "Image"
      )
    )
      continue
    images.set(reference.destination, {
      src: reference.destination,
      alt: reference.text ?? "",
      ...record(metadata[reference.destination], `images.${reference.destination}`),
    } as PostImageInput)
  }
  for (const [src, descriptor] of Object.entries(metadata))
    images.set(src, { src, alt: "", ...record(descriptor, `images.${src}`) } as PostImageInput)
  return images
}
