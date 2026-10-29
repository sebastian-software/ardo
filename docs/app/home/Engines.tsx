import { text } from "../i18n/messages"
import { Trans } from "@palamedes/react/macro"
import * as styles from "./home.css"
import { type MarkName, ToolMark } from "./logos"
import { NoteLabel } from "./NoteLabel"

type Engine = {
  mark: MarkName
  name: string
  text: string
  proof: string
  rest: string
  link: string
}

const ENGINES: Engine[] = [
  {
    mark: "ferromark",
    name: "Ferromark",
    text: "Our Markdown and MDX compiler. Pages go in, React components come out, with headings, table of contents and search data picked up on the way.",
    proof: "19 guides to JSX: 82 ms",
    rest: ". Median warm run, including highlighting.",
    link: "https://github.com/sebastian-software/ardo/blob/main/docs/reports/2026-10-29-release-benchmark.md#guide-compilation",
  },
  {
    mark: "ferriki",
    name: "Ferriki",
    text: "Our syntax highlighter. Every code block gets its colors during the build, light and dark, so the browser has nothing left to do.",
    proof: "185 code blocks to JSX: 77 ms",
    rest: ". Median warm run, light and dark.",
    link: "https://github.com/sebastian-software/ardo/blob/main/docs/reports/2026-10-29-release-benchmark.md#code-block-highlighting",
  },
]

type Friend = {
  mark: MarkName
  name: string
  text: string
  /** A measured claim; the card then spans two columns and links its evidence. */
  proof?: { claim: string; rest: string; link: string }
}

const FRIENDS: Friend[] = [
  {
    mark: "typescript",
    name: "TypeScript 7",
    text: "Its native compiler reads your types, and Ardo turns your exports into pages: components with their props, hooks and types. TypeDoc, rethought for React.",
    proof: {
      claim: "142 API pages: 655 ms",
      rest: ". Median source-to-Markdown run, fresh compiler session.",
      link: "https://github.com/sebastian-software/ardo/blob/main/docs/reports/2026-10-29-release-benchmark.md#api-generation",
    },
  },
  {
    mark: "vite",
    name: "Vite",
    text: "The dev server you already love. Save a file, watch the page update.",
  },
  {
    mark: "oxc",
    name: "Oxc",
    text: "Rust tooling that tidies up the compiled pages and maps your declarations.",
  },
]

export function Engines() {
  return (
    <section id="engines" className={`${styles.wrap} ${styles.section}`}>
      <NoteLabel>{text("under the hood")}</NoteLabel>
      <h2 className={styles.h2}>{text("Fast all the way down.")}</h2>
      <p className={styles.lead}>
        <Trans>
          Ardo stands on remarkable tools. Two of them come straight out of our own workshop,
          written in <span className={styles.circled}>Rust</span>.
        </Trans>
      </p>
      <div className={styles.engineGrid}>
        {ENGINES.map((engine, index) => (
          <div
            key={engine.name}
            className={`${styles.indexCard} ${styles.engineCard} ${index === 0 ? styles.tiltLeft : styles.tiltRightSoft}`}
          >
            <span
              className={`${styles.tape} ${index === 0 ? styles.tapeGreen : ""} ${styles.tapeCenter}`}
            />
            <div className={styles.engineHead}>
              <ToolMark name={engine.mark} size={46} />
              <h3 className={`${styles.h3} ${styles.engineName}`}>{engine.name}</h3>
            </div>
            <p className={styles.cardText}>{text(engine.text)}</p>
            <p className={styles.engineProof}>
              <mark>{text(engine.proof)}</mark>
              {text(engine.rest)}
            </p>
            <p className={styles.engineLink}>
              <a href={engine.link}>{text("Ardo 6.0 benchmark · Oct 29, 2026 · M1 Ultra →")}</a>
            </p>
          </div>
        ))}
      </div>
      <p className={`${styles.handGray} ${styles.hideSmall} ${styles.familyNote}`}>
        {text("both are part of Ferramenta, our little family of Rust tools ↑")}{" "}
      </p>
      <div className={styles.friendGrid}>
        {FRIENDS.map((friend) => (
          <div
            key={friend.name}
            className={`${styles.plainCard} ${friend.proof == null ? "" : styles.friendWide}`}
          >
            <span className={`${styles.tool} ${styles.friendName}`}>
              <ToolMark name={friend.mark} size={26} />
              {friend.name}
            </span>
            <p className={styles.friendText}>{text(friend.text)}</p>
            {friend.proof != null && (
              <>
                <p className={styles.engineProof}>
                  <mark>{text(friend.proof.claim)}</mark>
                  {text(friend.proof.rest)}
                </p>
                <p className={styles.engineLink}>
                  <a href={friend.proof.link}>
                    {text("Ardo 6.0 benchmark · Oct 29, 2026 · M1 Ultra →")}
                  </a>
                </p>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
