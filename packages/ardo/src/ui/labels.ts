export type ArdoContainerLabels = {
  tip: string
  warning: string
  danger: string
  info: string
  note: string
}

export type ArdoLabels = {
  page: {
    edit: string
    lastUpdated: string
    next: string
    previous: string
    navigation: string
    label: string
  }

  breadcrumb: {
    label: string
  }
  container: ArdoContainerLabels
  copyButton: {
    copy: string
    copied: string
    copyCode: string
    copyFailed: string
    manualCode: string
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
    sectionLabel: (section: string) => string
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
    sections: string
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
  theme: {
    toggle: string
    light: string
    dark: string
    system: string
    fixed: (mode: "light" | "dark" | "system") => string
  }
  toc: {
    label: string
    navLabel: string
  }
}

export type ArdoLabelsInput = {
  page?: Partial<ArdoLabels["page"]>
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
  theme?: Partial<ArdoLabels["theme"]>
  toc?: Partial<ArdoLabels["toc"]>
}

export const defaultArdoLabels: ArdoLabels = {
  page: {
    edit: "Edit this page",
    lastUpdated: "Last updated",
    next: "Next",
    previous: "Previous",
    navigation: "Page navigation",
    label: "Page",
  },
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
    copyFailed: "Copying failed. Copy the selected code below manually.",
    manualCode: "Code to copy manually",
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
    sectionLabel: (section) => section,
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
    sections: "Documentation sections",
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
  theme: {
    toggle: "Toggle theme",
    light: "Switch to light theme",
    dark: "Switch to dark theme",
    system: "Switch to system theme",
    fixed: (mode) => `Theme fixed to ${mode}`,
  },
  toc: {
    label: "On this page",
    navLabel: "Table of contents",
  },
}

export function resolveArdoLabels(input: ArdoLabelsInput | undefined): ArdoLabels {
  if (input == null) return defaultArdoLabels
  return {
    page: { ...defaultArdoLabels.page, ...input.page },
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
    theme: { ...defaultArdoLabels.theme, ...input.theme },
    toc: { ...defaultArdoLabels.toc, ...input.toc },
  }
}
