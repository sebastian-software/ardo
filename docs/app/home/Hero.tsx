import { text } from "../i18n/messages"
import { t } from "@palamedes/core/macro"
import { getI18n } from "@palamedes/runtime"
import { Trans } from "@palamedes/react/macro"
import codeBlock from "../assets/home/code-block.png"
import guidePage from "../assets/home/guide-page.png"
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
        <span className={styles.mono}>{text("ardo on npm")}</span>
        <span className={styles.factSeparator} />
        <span>MIT</span>
      </a>
    )
  }

  const downloads = formatCount(facts.lastMonth, getI18n().locale)
  const version = facts.version
  return (
    <a
      className={styles.facts}
      href={NPM_PACKAGE_URL}
      aria-label={t`Ardo on npm: version ${version}, ${downloads} downloads last month, MIT license`}
    >
      <ToolMark name="npm" size={22} />
      <span className={styles.mono}>ardo {facts.version}</span>
      <span className={`${styles.factSeparator} ${styles.hideSmall}`} />
      <span className={styles.factGroup}>
        <span>{t`${downloads} downloads last month`}</span>
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
          {text("Open source · for React projects")}{" "}
        </span>
        <h1 className={styles.h1}>
          <Trans>
            React docs, baked into <mark>plain HTML</mark>.
          </Trans>
        </h1>
        <p className={`${styles.lead} ${styles.heroLead}`}>
          {text(
            "Ardo is a static site generator for React projects. Guides in Markdown and MDX, an API reference read from your TypeScript, and search, all prerendered at build time by Rust engines."
          )}{" "}
        </p>
        <div className={styles.buttonRow}>
          <a className={`${styles.button} ${styles.buttonPrimary}`} href="#setup">
            {text("Get started")}{" "}
          </a>
          <a className={styles.button} href={GITHUB_URL}>
            {text("View on GitHub")}{" "}
          </a>
        </div>
        <div className={styles.factsRow}>
          <NpmLabel facts={facts} />
          <p className={`${styles.handGray} ${styles.hideSmall}`}>
            {text("← fresh from npm at every build")}{" "}
          </p>
        </div>
      </div>
      <div className={styles.heroArt}>
        <div className={`${styles.bubble} ${styles.heroBubble}`}>
          {text("Psst… a joy to write, a treat to read.")}{" "}
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
  { mark: "typescript", label: "TypeScript 7" },
  { mark: "oxc", label: "Oxc" },
  { mark: "ferromark", label: "Ferromark" },
  { mark: "ferriki", label: "Ferriki" },
]

export function ToolStrip() {
  return (
    <div className={styles.wrap}>
      <div className={styles.toolStrip}>
        <span className={styles.handNote}>{text("in good company:")}</span>
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
            alt={text(
              "The top of an Ardo guide page: section rail, sidebar, title and table of contents"
            )}
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
            alt={text(
              "Ardo's current API documentation guide, showing a typed configuration with its required tsconfig"
            )}
            width={940}
            height={528}
          />
        </div>
      </div>
      <div className={styles.teaserNoteTop}>
        <p className={styles.handNote}>{text("your folders become this rail")}</p>
        <ArrowDownRight className={styles.railArrow} />
      </div>
      <div className={styles.teaserNoteRight}>
        <p className={styles.handNote}>{text("highlighted at build time")}</p>
        <ArrowRight />
      </div>
    </section>
  )
}
