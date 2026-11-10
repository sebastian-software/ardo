import type { Metadata } from "sharp"

const TIFF_HEADER_OFFSET = 6
const GPS_IFD_POINTER = 0x88_25
const XMP_EXIF_NAMESPACE = "http://ns.adobe.com/exif/1.0/"
// XML whitespace only: `\s` also matches U+1680 and U+FEFF, which are valid in XML names.
const XMP_NAMESPACE_BINDING =
  /\bxmlns(?::([^ \t\r\n:=<>"'/]+))?[ \t\r\n]*=[ \t\r\n]*(?:"([^"]*)"|'([^']*)')/gu
const XMP_GPS_PROPERTY = /(?:^|[ \t\r\n<])(?:([^ \t\r\n:=<>"'/]+):)?GPS[A-Z]/gu

/** Whether an original would publish a location when it is emitted unchanged. */
export function hasGpsMetadata({ exif, xmp }: Pick<Metadata, "exif" | "xmp">): boolean {
  return (exif != null && exifHasGpsIfd(exif)) || (xmp != null && xmpHasGpsProperty(xmp))
}

/** XMP prefixes are arbitrary, so a GPS property counts under any prefix bound to the namespace. */
function xmpHasGpsProperty(xmp: Buffer): boolean {
  const packet = xmp.toString("utf8")
  const exifPrefixes = new Set(["exif"])
  for (const binding of packet.matchAll(XMP_NAMESPACE_BINDING))
    if (decodeCharacterReferences(binding[2] ?? binding[3] ?? "") === XMP_EXIF_NAMESPACE)
      exifPrefixes.add(binding[1] ?? "")
  for (const property of packet.matchAll(XMP_GPS_PROPERTY))
    if (exifPrefixes.has(property[1] ?? "")) return true
  return false
}

function decodeCharacterReferences(value: string): string {
  return value.replaceAll(
    /&#(?:x([\da-f]+)|(\d+));/giu,
    (reference, hex?: string, decimal?: string) => {
      const codePoint = hex == null ? Number(decimal) : Number.parseInt(hex, 16)
      return codePoint <= 0x10_ff_ff ? String.fromCodePoint(codePoint) : reference
    }
  )
}

/** Looks for the GPS IFD pointer in IFD0 of the EXIF block, whose TIFF header follows `Exif\0\0`. */
function exifHasGpsIfd(exif: Buffer): boolean {
  const start = exif.subarray(0, 4).toString("latin1") === "Exif" ? TIFF_HEADER_OFFSET : 0
  const order = exif.subarray(start, start + 2).toString("latin1")
  if (order !== "II" && order !== "MM") return false
  const littleEndian = order === "II"
  const readU16 = (offset: number) =>
    littleEndian ? exif.readUInt16LE(offset) : exif.readUInt16BE(offset)
  const readU32 = (offset: number) =>
    littleEndian ? exif.readUInt32LE(offset) : exif.readUInt32BE(offset)
  try {
    const ifd = start + readU32(start + 4)
    const entries = readU16(ifd)
    for (let index = 0; index < entries; index++)
      if (readU16(ifd + 2 + index * 12) === GPS_IFD_POINTER) return true
    return false
  } catch (error) {
    if (error instanceof RangeError) return false
    throw error
  }
}
