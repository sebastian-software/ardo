/** Copy and an optional CSS class for Ardo's independent client recovery view. */
export type ArdoClientRecoveryOptions = {
  title?: string
  description?: string
  reloadLabel?: string
  homeLabel?: string
  homeHref?: string
  className?: string
}

export type ArdoClientRecoveryContext = {
  /** The rendered document's language, independent of the site's translation runtime. */
  lang: string
  homeHref: string
  /** Loading failures retain the static page; rendering failures replace the failed tree. */
  preserveContent: boolean
}

/** Export `clientRecovery` from `app/root.tsx` to customize recovery without rendering React. */
export type ArdoClientRecovery =
  ArdoClientRecoveryOptions | ((context: ArdoClientRecoveryContext) => ArdoClientRecoveryOptions)

type RecoveryCopy = Required<
  Pick<ArdoClientRecoveryOptions, "title" | "description" | "reloadLabel" | "homeLabel">
>

const copy: Record<string, RecoveryCopy> = {
  en: {
    title: "This page could not start",
    description: "Reload the page or return home.",
    reloadLabel: "Reload page",
    homeLabel: "Back to home",
  },
  de: {
    title: "Diese Seite konnte nicht gestartet werden",
    description: "Lade die Seite neu oder gehe zur Startseite.",
    reloadLabel: "Seite neu laden",
    homeLabel: "Zur Startseite",
  },
  fr: {
    title: "Cette page n’a pas pu démarrer",
    description: "Rechargez la page ou revenez à l’accueil.",
    reloadLabel: "Recharger la page",
    homeLabel: "Retour à l’accueil",
  },
  es: {
    title: "No se ha podido iniciar esta página",
    description: "Recarga la página o vuelve al inicio.",
    reloadLabel: "Recargar la página",
    homeLabel: "Volver al inicio",
  },
}

/** Native DOM keeps recovery independent of the failed React tree, route, and translation catalog. */
export function showClientRecovery({
  container,
  preserveContent,
  homeHref,
  customize,
}: {
  container: HTMLElement
  preserveContent: boolean
  homeHref: string
  customize?: ArdoClientRecovery
}): void {
  if (container.querySelector("[data-ardo-recovery]") != null) return
  const document = container.ownerDocument
  const lang = document.documentElement.lang || "en"
  const context = { lang, homeHref, preserveContent }
  const options = resolveRecoveryOptions(customize, context)
  const { panel, title } = createRecoveryPanel(document, context, options)
  if (preserveContent) container.prepend(panel)
  else container.replaceChildren(panel)
  title.focus()
}

function resolveRecoveryOptions(
  customize: ArdoClientRecovery | undefined,
  context: ArdoClientRecoveryContext
): ArdoClientRecoveryOptions {
  const options: ArdoClientRecoveryOptions = {}
  try {
    const custom = typeof customize === "function" ? customize(context) : customize
    // Snapshot getters here as well: a failed translation callback/catalog cannot break recovery.
    for (const key of [
      "title",
      "description",
      "reloadLabel",
      "homeLabel",
      "homeHref",
      "className",
    ] as const) {
      const value = custom?.[key]
      if (typeof value === "string" && value.trim() !== "") options[key] = value
    }
  } catch {
    return {}
  }
  return options
}

function createRecoveryPanel(
  document: Document,
  context: ArdoClientRecoveryContext,
  options: ArdoClientRecoveryOptions
) {
  const language = context.lang.toLowerCase().split("-")[0]
  const defaults = Object.hasOwn(copy, language) ? copy[language] : copy.en
  const panel = document.createElement(context.preserveContent ? "section" : "main")
  panel.dataset.ardoRecovery = context.preserveContent ? "static" : "fatal"
  panel.setAttribute("role", "alert")
  // Unsupported languages use English; keep the pronunciation of the fallback copy accurate.
  panel.lang = Object.hasOwn(copy, language) || options.title != null ? context.lang : "en"
  panel.className = options.className ?? ""
  panel.style.cssText =
    "box-sizing:border-box;position:relative;z-index:2147483647;max-width:48rem;margin:1rem auto;padding:1.5rem;border:2px solid currentColor;border-radius:.5rem;background:Canvas;color:CanvasText;font:1rem/1.6 system-ui,sans-serif;text-align:start;overflow-wrap:anywhere"
  const title = document.createElement(context.preserveContent ? "h2" : "h1")
  title.textContent = options.title ?? defaults.title
  title.tabIndex = -1
  title.style.cssText = "margin:0;font-size:1.5rem;line-height:1.3"
  panel.append(title, ...createRecoveryControls(document, context, { ...defaults, ...options }))
  return { panel, title }
}

function createRecoveryControls(
  document: Document,
  context: ArdoClientRecoveryContext,
  options: ArdoClientRecoveryOptions & RecoveryCopy
) {
  const description = document.createElement("p")
  description.textContent = options.description
  const reload = document.createElement("button")
  reload.type = "button"
  reload.textContent = options.reloadLabel
  reload.addEventListener("click", () => document.defaultView?.location.reload())
  reload.style.cssText = "font:inherit;padding:.4rem .8rem;margin-inline-end:1rem;cursor:pointer"
  const home = document.createElement("a")
  home.textContent = options.homeLabel
  home.href = safeHomeHref(options.homeHref, context.homeHref, document.baseURI)
  return [description, reload, home]
}

function safeHomeHref(custom: string | undefined, fallback: string, base: string): string {
  for (const value of [custom, fallback]) {
    if (value == null) continue
    try {
      const url = new URL(value, base)
      if (url.protocol === "https:" || url.protocol === "http:") return url.href
    } catch {
      // Malformed customization falls back to the server-rendered page base.
    }
  }
  return "/"
}

/** Keep the original failure visible to browser diagnostics without depending on its hooks. */
export function reportClientRecoveryError(error: unknown): void {
  try {
    if (typeof globalThis.reportError === "function") {
      globalThis.reportError(error)
      return
    }
  } catch {
    // A site's diagnostic hook must not prevent the independent recovery UI.
  }
  try {
    console.error(error)
  } catch {
    // Console hooks can fail too; recovery still needs to work.
  }
}
