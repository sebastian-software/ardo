import { text } from "../i18n/messages"
import { CopyPromptButton, PromptText, SETUP_PROMPT } from "./CopyPromptButton"
import { CoffeeRing, Paperclip } from "./doodles"
import * as styles from "./home.css"
import { NoteLabel } from "./NoteLabel"

export function HowItWorks() {
  return (
    <section className={`${styles.wrap} ${styles.section} ${styles.sectionTight}`}>
      <NoteLabel>{text("how it works")}</NoteLabel>
      <h2 className={styles.h2}>{text("From repo to website, no server to babysit.")}</h2>
      <div className={styles.cardGrid}>
        <div className={`${styles.indexCard} ${styles.tiltLeft}`}>
          <span className={styles.circleNumber}>1</span>
          <h3 className={styles.h3}>{text("Write it")}</h3>
          <ul className={styles.list}>
            <li className={styles.bullet}>{text("Markdown and MDX guides")}</li>
            <li className={styles.bullet}>{text("Your own components and layouts")}</li>
            <li className={styles.bullet}>{text("API reference from TypeScript")}</li>
            <li className={styles.bullet}>{text("Typed content collections")}</li>
          </ul>
        </div>
        <div className={`${styles.indexCard} ${styles.tiltRight}`}>
          <span className={styles.circleNumber}>2</span>
          <h3 className={styles.h3}>{text("Bake it")}</h3>
          <p className={styles.cardText}>
            {text(
              "Rust engines compile your Markdown and color every code block, TypeScript 7 reads your types, and Vite bundles the rest. Search index, sitemap and llms.txt come out of the same oven."
            )}{" "}
          </p>
        </div>
        <div className={`${styles.indexCard} ${styles.tiltSlight}`}>
          <span className={styles.circleNumber}>3</span>
          <h3 className={styles.h3}>{text("Serve it")}</h3>
          <p className={styles.cardText}>
            {text(
              "Every page is complete HTML. Search engines see everything, readers get the content on the first request, and any static host will do."
            )}{" "}
          </p>
        </div>
      </div>
    </section>
  )
}

export function AgentSetup() {
  return (
    <section id="setup" className={`${styles.wrap} ${styles.section}`}>
      <div className={styles.splitRow}>
        <div className={styles.splitText}>
          <NoteLabel>{text("the easy way in")}</NoteLabel>
          <h2 className={styles.h2}>{text("Let your agent do the setup.")}</h2>
          <p className={styles.lead}>
            {text(
              "No starter template, no copy-paste marathon. Hand this sentence to your coding agent, in a fresh repo or one you already have. The link points it to Ardo’s official instructions. It adapts the tested example and tells you how typecheck, tests and build went. You review it like any other pull request."
            )}{" "}
          </p>
        </div>
        <div className={styles.promptColumn}>
          <CoffeeRing className={`${styles.hideSmall} ${styles.coffee}`} />
          <div className={`${styles.sticky} ${styles.promptNote}`}>
            <Paperclip style={{ left: 34, top: -22, transform: "rotate(-8deg)" }} />
            <p className={`${styles.mono} ${styles.promptText}`}>
              <PromptText text={text(SETUP_PROMPT)} />
            </p>
            <div className={styles.promptAction}>
              <CopyPromptButton />
            </div>
          </div>
          <p className={`${styles.handNote} ${styles.hideSmall} ${styles.promptAside}`}>
            {text("yep, that’s the whole prompt. grab a coffee meanwhile.")}{" "}
          </p>
        </div>
      </div>
    </section>
  )
}
