import codeBlock from "../assets/home/code-block.webp"
import guidePage from "../assets/home/guide-page.webp"
import mascot from "../assets/mascot.webp"
import { ArrowDownRight, ArrowRight, Footprints } from "./doodles"
import * as styles from "./home.css"
import { type MarkName, ToolMark } from "./logos"
import { formatCount, NPM_PACKAGE_URL, type NpmFacts } from "./npm-facts"

const GITHUB_URL = "https://github.com/sebastian-software/ardo"

function NpmLabel({ facts }: { facts: NpmFacts | null }) {
  if (facts === null) {
    return (
      <a className={styles.facts} href={NPM_PACKAGE_URL}>
        <ToolMark name="npm" size={22} />
        <span className={styles.mono}>ardo on npm</span>
        <span className={styles.factSeparator} />
        <span>MIT</span>
      </a>
    )
  }

  const downloads = formatCount(facts.lastMonth)
  return (
    <a
      className={styles.facts}
      href={NPM_PACKAGE_URL}
      aria-label={`Ardo on npm: version ${facts.version}, ${downloads} downloads last month, MIT license`}
    >
      <ToolMark name="npm" size={22} />
      <span className={styles.mono}>ardo {facts.version}</span>
      <span className={`${styles.factSeparator} ${styles.hideSmall}`} />
      <span className={styles.factGroup}>
        <span>{downloads} downloads last month</span>
        <span className={styles.factSeparator} />
        <span>MIT</span>
      </span>
    </a>
  )
}

export function Hero({ facts }: { facts: NpmFacts | null }) {
  return (
    <section className={`${styles.wrap} ${styles.hero}`}>
      <div className={styles.heroText}>
        <span className={`${styles.sticky} ${styles.eyebrow}`}>
          Open source · for React projects
        </span>
        <h1 className={styles.h1}>
          React docs, baked into <mark>plain HTML</mark>.
        </h1>
        <p className={`${styles.lead} ${styles.heroLead}`}>
          Ardo is a static site generator for React projects. Guides in Markdown and MDX, an API
          reference read from your TypeScript, and search, all prerendered at build time by Rust
          engines.
        </p>
        <div className={styles.buttonRow}>
          <a className={`${styles.button} ${styles.buttonPrimary}`} href="#setup">
            Get started
          </a>
          <a className={styles.button} href={GITHUB_URL}>
            View on GitHub
          </a>
        </div>
        <div className={styles.factsRow}>
          <NpmLabel facts={facts} />
          <p className={`${styles.handGray} ${styles.hideSmall}`}>
            ← fresh from npm at every build
          </p>
        </div>
      </div>
      <div className={styles.heroArt}>
        <div className={`${styles.bubble} ${styles.heroBubble}`}>
          Psst… a joy to write, a treat to read.
        </div>
        <img
          className={`${styles.heroOwl} ${styles.bobbing}`}
          src={mascot}
          alt=""
          width={720}
          height={747}
        />
        <Footprints className={`${styles.hideSmall} ${styles.heroFeet}`} />
      </div>
    </section>
  )
}

const TOOLS: { mark: MarkName; label: string }[] = [
  { mark: "vite", label: "Vite" },
  { mark: "reactRouter", label: "React Router" },
  { mark: "typescript", label: "TypeScript 7" },
  { mark: "oxc", label: "Oxc" },
  { mark: "ferromark", label: "Ferromark" },
  { mark: "ferriki", label: "Ferriki" },
]

export function ToolStrip() {
  return (
    <div className={styles.wrap}>
      <div className={styles.toolStrip}>
        <span className={styles.handNote}>in good company:</span>
        {TOOLS.map((item) => (
          <span key={item.mark} className={styles.tool}>
            <ToolMark name={item.mark} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function Teaser() {
  return (
    <section className={`${styles.wrap} ${styles.teaser}`}>
      <div className={`${styles.paper} ${styles.teaserMain}`}>
        <span className={`${styles.tape} ${styles.tapeLeft}`} />
        <span className={`${styles.tape} ${styles.tapeGreen} ${styles.tapeRight}`} />
        <div className={`${styles.tornBottom} ${styles.teaserMainFrame}`}>
          <img
            className={styles.shotCover}
            src={guidePage}
            alt="The top of an Ardo guide page: section rail, sidebar, title and table of contents"
            width={1600}
            height={689}
          />
        </div>
      </div>
      <div className={`${styles.paper} ${styles.teaserSecond}`}>
        <span className={`${styles.tape} ${styles.tapeCenter}`} />
        <div className={`${styles.tornBoth} ${styles.teaserSecondFrame}`}>
          <img
            className={styles.shotCover}
            src={codeBlock}
            alt="An Ardo code block titled ardo.config.ts, with colored syntax and highlighted lines"
            width={940}
            height={528}
          />
        </div>
      </div>
      <div className={styles.teaserNoteTop}>
        <p className={styles.handNote}>your folders become this rail</p>
        <ArrowDownRight className={styles.railArrow} />
      </div>
      <div className={styles.teaserNoteRight}>
        <p className={styles.handNote}>highlighted at build time</p>
        <ArrowRight />
      </div>
    </section>
  )
}
