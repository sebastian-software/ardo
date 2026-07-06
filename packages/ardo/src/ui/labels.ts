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
    navigationMenu: string
    titledNavigationMenu: (title: string) => string
  }
  search: {
    clear: string
    closeOverlay: string
    close: string
    label: string
    navigate: string
    noResults: (query: string) => string
    placeholder: string
    resultCount: (count: number) => string
    results: string
    select: string
  }
  sidebar: {
    collapse: string
    expand: string
    mainNavigation: string
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
    navigationMenu: "Navigation menu",
    titledNavigationMenu: (title) => `${title} navigation menu`,
  },
  search: {
    clear: "Clear search",
    closeOverlay: "Close search",
    close: "to close",
    label: "Search",
    navigate: "to navigate",
    noResults: (query) => `No results found for "${query}"`,
    placeholder: "Search...",
    resultCount: (count) => `${String(count)} ${count === 1 ? "result" : "results"}`,
    results: "Search results",
    select: "to select",
  },
  sidebar: {
    collapse: "Collapse",
    expand: "Expand",
    mainNavigation: "Main navigation",
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
    toc: { ...defaultArdoLabels.toc, ...input.toc },
  }
}
