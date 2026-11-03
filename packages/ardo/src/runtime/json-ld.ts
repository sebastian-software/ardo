const UNSAFE_JSON_LD_CHARACTERS = /[<>&\u2028\u2029]/gu

/**
 * JSON for a `<script type="application/ld+json">` element. Escaping `<` keeps a title such as
 * `</script>` from closing the element early. `>`, `&`, and the line separators are escaped too,
 * so the output is safe in any HTML context, and every escape stays valid JSON.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replaceAll(
    UNSAFE_JSON_LD_CHARACTERS,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`
  )
}
