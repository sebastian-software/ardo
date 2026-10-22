export type ArdoContainerLabels = {
  tip: string
  warning: string
  danger: string
  info: string
  note: string
}

export type ArdoLabels = {
  breadcrumb: {
    label: string
  }
  container: ArdoContainerLabels
  copyButton: {
    copy: string
    copied: string
    copyCode: string
  }
  footer: {
    builtOn: string
    builtWithArdo: string
    sponsoredBy: string
  }
  header: {
    toggleMenu: string
  }
  layout: {
    skipToContent: string
  }
  mobilePanel: {
    closeMenu: string
    home: string
    navigationMenu: string
    titledNavigationMenu: (title: string) => string
  }
  search: {
    clear: string
    closeOverlay: string
    close: string
    label: string
    loading: string
    loadError: string
    navigate: string
    noResults: (query: string) => string
    placeholder: string
    resultCount: (count: number) => string
    results: string
    retry: string
    select: string
  }
  sidebar: {
    collapse: string
    expand: string
    mainNavigation: string
  }
  siteControls: {
    appearance: string
    language: string
    links: string
    version: string
    /** Banner text on a version other than the latest. */
    olderVersion: (version: string) => string
    /** Banner link to the latest version. */
    latestVersion: (version: string) => string
  }
  toc: {
    label: string
    navLabel: string
  }
}

export type ArdoLabelsInput = {
  breadcrumb?: Partial<ArdoLabels["breadcrumb"]>
  container?: Partial<ArdoContainerLabels>
  copyButton?: Partial<ArdoLabels["copyButton"]>
  footer?: Partial<ArdoLabels["footer"]>
  header?: Partial<ArdoLabels["header"]>
  layout?: Partial<ArdoLabels["layout"]>
  mobilePanel?: Partial<ArdoLabels["mobilePanel"]>
  search?: Partial<ArdoLabels["search"]>
  sidebar?: Partial<ArdoLabels["sidebar"]>
  siteControls?: Partial<ArdoLabels["siteControls"]>
  toc?: Partial<ArdoLabels["toc"]>
}

export const defaultArdoLabels: ArdoLabels = {
  breadcrumb: {
    label: "Breadcrumb",
  },
  container: {
    tip: "TIP",
    warning: "WARNING",
    danger: "DANGER",
    info: "INFO",
    note: "NOTE",
  },
  copyButton: {
    copy: "Copy",
    copied: "Copied!",
    copyCode: "Copy code",
  },
  footer: {
    builtOn: "Built on",
    builtWithArdo: "Built with Ardo",
    sponsoredBy: "Sponsored by",
  },
  header: {
    toggleMenu: "Toggle menu",
  },
  layout: {
    skipToContent: "Skip to content",
  },
  mobilePanel: {
    closeMenu: "Close menu",
    home: "Home",
    navigationMenu: "Navigation menu",
    titledNavigationMenu: (title) => `${title} navigation menu`,
  },
  search: {
    clear: "Clear search",
    closeOverlay: "Close search",
    close: "to close",
    label: "Search",
    loading: "Searching…",
    loadError: "Search could not load. Reload the page to try again.",
    navigate: "to navigate",
    noResults: (query) => `No results found for "${query}"`,
    placeholder: "Search...",
    resultCount: (count) => `${String(count)} ${count === 1 ? "result" : "results"}`,
    results: "Search results",
    retry: "Reload search",
    select: "to select",
  },
  sidebar: {
    collapse: "Collapse",
    expand: "Expand",
    mainNavigation: "Main navigation",
  },
  siteControls: {
    appearance: "Appearance",
    language: "Language",
    links: "Links",
    version: "Version",
    olderVersion: (version) => `You are reading the documentation for ${version}.`,
    latestVersion: (version) => `Go to the latest version (${version})`,
  },
  toc: {
    label: "On this page",
    navLabel: "Table of contents",
  },
}

export function resolveArdoLabels(input: ArdoLabelsInput | undefined): ArdoLabels {
  if (input == null) return defaultArdoLabels
  return {
    breadcrumb: { ...defaultArdoLabels.breadcrumb, ...input.breadcrumb },
    container: { ...defaultArdoLabels.container, ...input.container },
    copyButton: { ...defaultArdoLabels.copyButton, ...input.copyButton },
    footer: { ...defaultArdoLabels.footer, ...input.footer },
    header: { ...defaultArdoLabels.header, ...input.header },
    layout: { ...defaultArdoLabels.layout, ...input.layout },
    mobilePanel: { ...defaultArdoLabels.mobilePanel, ...input.mobilePanel },
    search: { ...defaultArdoLabels.search, ...input.search },
    sidebar: { ...defaultArdoLabels.sidebar, ...input.sidebar },
    siteControls: { ...defaultArdoLabels.siteControls, ...input.siteControls },
    toc: { ...defaultArdoLabels.toc, ...input.toc },
  }
}
