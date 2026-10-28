import { t, plural } from "@palamedes/core/macro"
import type { ArdoLabels } from "ardo/ui"

export function translatedLabels(): ArdoLabels {
  return {
    page: {
      edit: t`Edit this page`,
      lastUpdated: t`Last updated`,
      next: t`Next`,
      previous: t`Previous`,
      navigation: t`Page navigation`,
      label: t`Page`,
    },
    breadcrumb: {
      label: t`Breadcrumb`,
    },
    container: {
      tip: t`TIP`,
      warning: t`WARNING`,
      danger: t`DANGER`,
      info: t`INFO`,
      note: t`NOTE`,
    },
    copyButton: {
      copy: t`Copy`,
      copied: t`Copied!`,
      copyCode: t`Copy code`,
      copyFailed: t`Copying failed. Copy the selected code below manually.`,
      manualCode: t`Code to copy manually`,
    },
    footer: {
      builtOn: t`Built on`,
      builtWithArdo: t`Built with Ardo`,
      sponsoredBy: t`Sponsored by`,
    },
    header: {
      toggleMenu: t`Toggle menu`,
    },
    layout: {
      skipToContent: t`Skip to content`,
    },
    mobilePanel: {
      closeMenu: t`Close menu`,
      home: t`Home`,
      navigationMenu: t`Navigation menu`,
      titledNavigationMenu: (title) => t`${title} navigation menu`,
    },
    search: {
      sectionLabel: (section) =>
        section
          .split(" > ")
          .map((part) =>
            part === "Guide"
              ? t`Guide`
              : part === "Api Reference"
                ? t`API reference`
                : part === "Releases"
                  ? t`Releases`
                  : part
          )
          .join(" > "),
      clear: t`Clear search`,
      closeOverlay: t`Close search`,
      close: t`to close`,
      label: t`Search`,
      loading: t`Searching…`,
      loadError: t`Search could not load. Reload the page to try again.`,
      navigate: t`to navigate`,
      noResults: (query) => t`No results found for "${query}"`,
      placeholder: t`Search...`,
      resultCount: (count) => plural(count, { one: "# result", other: "# results" }),
      results: t`Search results`,
      retry: t`Reload search`,
      select: t`to select`,
    },
    sidebar: {
      collapse: t`Collapse`,
      expand: t`Expand`,
      sections: t`Documentation sections`,
      mainNavigation: t`Main navigation`,
    },
    siteControls: {
      appearance: t`Appearance`,
      language: t`Language`,
      links: t`Links`,
      version: t`Version`,
      olderVersion: (version) => t`You are reading the documentation for ${version}.`,
      latestVersion: (version) => t`Go to the latest version (${version})`,
    },
    theme: {
      toggle: t`Toggle theme`,
      light: t`Switch to light theme`,
      dark: t`Switch to dark theme`,
      system: t`Switch to system theme`,
      fixed: (mode) =>
        mode === "light"
          ? t`Theme fixed to light`
          : mode === "dark"
            ? t`Theme fixed to dark`
            : t`Theme fixed to system`,
    },
    toc: {
      label: t`On this page`,
      navLabel: t`Table of contents`,
    },
  }
}
