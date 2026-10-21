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
    proof: "2.6× faster than pulldown-cmark",
    rest: " on 50 real documents.",
    link: "https://ferromark.dev/guide/benchmarks",
  },
  {
    mark: "ferriki",
    name: "Ferriki",
    text: "Our syntax highlighter. Every code block gets its colors during the build, light and dark, so the browser has nothing left to do.",
    proof: "4.7× faster than Shiki on WebAssembly",
    rest: ", same HTML.",
    link: "https://ferriki.dev/evidence/benchmarks",
  },
]

const FRIENDS: { mark: MarkName; name: string; text: string }[] = [
  {
    mark: "typescript",
    name: "TypeScript 7",
    text: "The native compiler reads your types. It built Ardo’s own API docs 4.3× faster than TypeDoc.",
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
      <NoteLabel>under the hood</NoteLabel>
      <h2 className={styles.h2}>Fast all the way down.</h2>
      <p className={styles.lead}>
        Ardo stands on remarkable tools. Two of them come straight out of our own workshop, written
        in <span className={styles.circled}>Rust</span>.
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
            <p className={styles.cardText}>{engine.text}</p>
            <p className={styles.engineProof}>
              <mark>{engine.proof}</mark>
              {engine.rest}
            </p>
            <p className={styles.engineLink}>
              <a href={engine.link}>See the benchmark →</a>
            </p>
          </div>
        ))}
      </div>
      <p className={`${styles.handGray} ${styles.hideSmall} ${styles.familyNote}`}>
        both are part of Ferramenta, our little family of Rust tools ↑
      </p>
      <div className={styles.friendGrid}>
        {FRIENDS.map((friend) => (
          <div key={friend.name} className={styles.plainCard}>
            <span className={`${styles.tool} ${styles.friendName}`}>
              <ToolMark name={friend.mark} size={26} />
              {friend.name}
            </span>
            <p className={styles.friendText}>{friend.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
