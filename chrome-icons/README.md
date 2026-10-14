# Chrome icon selection

This directory contains 21 unique [Streamline Core Line](https://www.streamlinehq.com/icons/core-line) SVGs for the 22 chrome icon roles in [issue #345](https://github.com/sebastian-software/ardo/issues/345). The breadcrumb separator reuses the chevron with a CSS rotation. The icons come from the full Core Line catalog, on its native 14 × 14 grid with a 1 px editable stroke and `currentColor`. The original Streamline metadata is retained.

Open [preview.html](preview.html) to compare the icons on light and dark surfaces. Header controls are shown at 14 and 16 px; inline icons at 12 and 14 px; callouts at 14 and 18 px, and copy controls at 14 and 16 px. The 14 px grid is the design source for every SVG.

| Role                 | SVG                                        | Streamline primary          | Alternate to discuss        |
| -------------------- | ------------------------------------------ | --------------------------- | --------------------------- |
| Search               | [`search.svg`](search.svg)                 | Magnifying Glass            | Magnifying Glass Circle     |
| Close                | [`close.svg`](close.svg)                   | Delete 1                    | Delete 2                    |
| Menu                 | [`menu.svg`](menu.svg)                     | Hamburger Menu 1            | Hamburger Menu 2            |
| Sidebar toggle       | [`sidebar-toggle.svg`](sidebar-toggle.svg) | Layout Left Sidebar         | Bar Sidebar Left Panel Open |
| Light theme          | [`light-theme.svg`](light-theme.svg)       | Sun Haze                    | Brightness 1                |
| Dark theme           | [`dark-theme.svg`](dark-theme.svg)         | Angled Moon                 | Moon Stars                  |
| System theme         | [`system-theme.svg`](system-theme.svg)     | Desktop                     | Screen 1                    |
| Language             | [`language.svg`](language.svg)             | Translate Text              | Globe Website Solo          |
| External link        | [`external-link.svg`](external-link.svg)   | New Window                  | Line Arrow Expand Window 2  |
| Chevron              | [`chevron.svg`](chevron.svg)               | Chevron Arrow Down          | Arrow Down 3                |
| Breadcrumb separator | [`chevron.svg`](chevron.svg), rotated −90° | Chevron Arrow Down          | Chevron Arrow Right         |
| Previous / next      | [`previous-next.svg`](previous-next.svg)   | Line Arrow Right 1          | Arrow Right 3               |
| Tip                  | [`tip.svg`](tip.svg)                       | Content Insight Idea Trivia | Lightbulb On                |
| Info                 | [`info.svg`](info.svg)                     | Information Circle          | Information Square          |
| Note                 | [`note.svg`](note.svg)                     | New Sticky Note             | Pencil Square               |
| Warning              | [`warning.svg`](warning.svg)               | Warning Triangle            | Warning Circle              |
| Danger               | [`danger.svg`](danger.svg)                 | Warning Diamond             | Dangerous                   |
| Copy                 | [`copy.svg`](copy.svg)                     | Copy 2                      | Copy 1                      |
| Copied               | [`copied.svg`](copied.svg)                 | Check                       | Check Thick                 |
| Edit                 | [`edit.svg`](edit.svg)                     | Pencil                      | Pencil Diagonal             |
| Last updated         | [`last-updated.svg`](last-updated.svg)     | Clock Solo                  | Circle Clock                |
| Heading link         | [`heading-link.svg`](heading-link.svg)     | Link Chain                  | Link Chain Horizontal       |

The alternate names refer to Core Line assets and are not bundled. The selected 14 px variants are Warning Diamond for danger, Translate Text for language, Sun Haze for light theme, and Content Insight Idea Trivia for tip. The UI uses the 14 px size for header controls; the preview also shows 16 px for review.

## Attribution and license

Icons © [Streamline Design Inc.](https://streamlinehq.com), used under the [Streamline Premium License](https://help.streamlinehq.com/en/articles/5354366-streamline-premium-licenses). They are not covered by Ardo's MIT license. See [`packages/ardo/ICONS-LICENSE.md`](../packages/ardo/ICONS-LICENSE.md) for the package notice.
