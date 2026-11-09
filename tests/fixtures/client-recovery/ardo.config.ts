import { defineArdoConfig } from "ardo/config"

export default defineArdoConfig({
  title: "Recovery fixture",
  base: "/recover/",
  i18n: { defaultLocale: "en", locales: [{ id: "en" }, { id: "de" }] },
})
