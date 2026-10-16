import { Link } from "react-router"

import apiPage from "../assets/home/api-page.webp"
import callouts from "../assets/home/callouts.webp"
import components from "../assets/home/components.webp"
import { MoonAndStars } from "./doodles"
import * as styles from "./home.css"
import { NoteLabel } from "./NoteLabel"

export function Components() {
  return (
    <section
      className={`${styles.wrap} ${styles.section} ${styles.splitRow} ${styles.splitReverse}`}
    >
      <div className={styles.splitMedia}>
        <div className={`${styles.paper} ${styles.mediaLeft}`}>
          <span className={`${styles.tape} ${styles.tapeGreen} ${styles.tapeLeftSmall}`} />
          <div className={`${styles.tornBoth} ${styles.componentsFrame}`}>
            <img
              className={styles.shotCover}
              src={components}
              alt="Ardo cards with icons, above the MDX that renders them"
              width={1100}
              height={550}
            />
          </div>
        </div>
        <div className={`${styles.paper} ${styles.componentsSecond}`}>
          <span className={`${styles.tape} ${styles.tapeCenter}`} />
          <div className={`${styles.tornBoth} ${styles.componentsSecondFrame}`}>
            <img
              className={styles.shotCover}
              src={callouts}
              alt="Ardo callouts: note, tip, important and warning"
              width={1100}
              height={1031}
            />
          </div>
        </div>
        <p className={`${styles.handNote} ${styles.hideSmall} ${styles.mediaNoteLeft}`}>
          your design system fits right in
        </p>
      </div>
      <div className={styles.splitText}>
        <NoteLabel number={4}>components and layouts</NoteLabel>
        <h2 className={styles.h2}>Your components are invited.</h2>
        <p className={styles.lead}>
          Drop your design system straight into MDX, or build landing pages and layouts in plain
          React. Ardo brings cards, tabs, steps, accordions and callouts for everything around them.
        </p>
        <p className={styles.moreLink}>
          <Link to="/guide/markdown">Components in MDX →</Link>
        </p>
      </div>
    </section>
  )
}

export function ApiReference() {
  return (
    <section className={`${styles.wrap} ${styles.section} ${styles.splitRow}`}>
      <div className={styles.splitText}>
        <NoteLabel number={5}>API reference for TypeScript</NoteLabel>
        <h2 className={styles.h2}>Your types, now with a website.</h2>
        <p className={styles.lead}>
          Point Ardo at your entry point and every export gets its own page, with signature,
          parameters and linked types. It shows up in search, too, and it updates on the next build.
        </p>
        <p className={styles.moreLink}>
          <Link to="/api-reference">Browse Ardo’s own API reference →</Link>
        </p>
      </div>
      <div className={styles.splitMedia}>
        <div className={`${styles.paper} ${styles.mediaRight}`}>
          <span className={`${styles.tape} ${styles.tapeRightSmall}`} />
          <div className={`${styles.tornBoth} ${styles.mediaFrame}`}>
            <img
              className={styles.shotCover}
              src={apiPage}
              alt="A generated API page for defineConfig"
              width={1100}
              height={688}
            />
          </div>
        </div>
        <p className={`${styles.handNote} ${styles.hideSmall} ${styles.mediaNoteLeft}`}>
          generated, not typed by hand
        </p>
      </div>
    </section>
  )
}

const PALETTES = [
  {
    name: "Olive Owl",
    note: "green · orange · warm gray",
    colors: ["#617042", "#b14420", "#f3f0e6"],
  },
  { name: "Berry", note: "Ardo’s default", colors: ["#a8285e", "#46647f", "#f4f0f1"] },
  { name: "Blueprint", note: "blue · teal · slate", colors: ["#2f5fd0", "#1f7a6c", "#eef2f8"] },
]

export function Theming() {
  return (
    <section className={`${styles.wrap} ${styles.section}`}>
      <NoteLabel number={6}>theming</NoteLabel>
      <h2 className={styles.h2}>Dress it up in one line.</h2>
      <p className={styles.lead}>
        Pick a brand, an accent and a neutral hue. Ardo works out light and dark mode from there.
        Want more? Override any token or swap a component.
      </p>
      <div className={styles.swatchGrid}>
        {PALETTES.map((palette, index) => (
          <div
            key={palette.name}
            className={`${styles.swatchCard} ${styles.swatchTilt[index % 3]}`}
          >
            <div className={styles.swatch} style={{ background: palette.colors[0] }} />
            <div className={styles.swatchThin} style={{ background: palette.colors[1] }} />
            <div className={styles.swatchThin} style={{ background: palette.colors[2] }} />
            <div className={styles.swatchLabel}>
              <strong>{palette.name}</strong>
              <br />
              <span className={styles.swatchNote}>{palette.note}</span>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.nightNote}>
        <MoonAndStars />
        <p className={styles.handNote}>dark mode included, for fellow night owls</p>
      </div>
    </section>
  )
}
