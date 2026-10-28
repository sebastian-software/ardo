import { text, text as textCopy, localizedPath } from "../i18n/messages"
import { ArdoLink } from "ardo/ui"

import * as styles from "./home.css"
import { NoteLabel } from "./NoteLabel"

const NEIGHBORS = [
  [
    "Docusaurus",
    "React and MDX too, on a newer foundation: Vite and native engines, with plain HTML pages.",
  ],
  ["VitePress", "Vite and Markdown too, with React instead of Vue."],
  ["Starlight", "Static and content-first too, with React as the page model, not an island."],
  ["Nextra", "React and MDX too, without Next.js. Plain static files come out."],
  ["Fumadocs", "React too, as a toolkit. Ardo is one complete setup with its own engines."],
  [
    "Rspress",
    "A Rust-powered build too, on Rspack. Ardo builds on Vite and reads your TypeScript.",
  ],
  [
    "Vocs",
    "React and Vite too. Ardo adds an API reference from your TypeScript and native engines.",
  ],
  ["Docus", "The same idea for Nuxt and Vue. Ardo is the React counterpart."],
  [
    "Material for MkDocs",
    "Mature and Markdown-first, in Python. Ardo stays in the React toolchain.",
  ],
  ["Mintlify", "A hosted platform. Ardo is open source and lives in your repo."],
] as const

export function WhereArdoFits() {
  return (
    <section className={`${styles.wrap} ${styles.section}`}>
      <NoteLabel>{text("where Ardo fits")}</NoteLabel>
      <h2 className={styles.h2}>{text("Know one of these? Then you almost know Ardo.")}</h2>
      <ul className={styles.compareGrid}>
        {NEIGHBORS.map(([name, text]) => (
          <li key={name} className={styles.compareRow}>
            <span className={styles.compareName}>{name}</span>
            <span className={styles.muted}>{textCopy(text)}</span>
          </li>
        ))}
      </ul>
      <p className={styles.moreLink}>
        <ArdoLink to={localizedPath("/guide/what-is-ardo#how-ardo-compares")}>
          {text("Read the full comparison →")}
        </ArdoLink>
      </p>
    </section>
  )
}

export function FitCheck() {
  return (
    <section className={`${styles.wrap} ${styles.section}`}>
      <NoteLabel>{text("fit check")}</NoteLabel>
      <h2 className={styles.h2}>{text("Is Ardo your kind of bird?")}</h2>
      <div className={styles.fitGrid}>
        <div
          className={`${styles.sticky} ${styles.stickyGreen} ${styles.fitNote} ${styles.tiltLeftSoft}`}
        >
          <h3 className={styles.fitTitle}>{text("A great fit if")}</h3>
          <ul className={styles.list}>
            <li className={styles.check}>
              {text("your product or library is built with React and TypeScript")}{" "}
            </li>
            <li className={styles.check}>
              {text("docs should live in your repo and go through review")}
            </li>
            <li className={styles.check}>
              {text("you want prerendered pages and little work in the browser")}{" "}
            </li>
          </ul>
        </div>
        <div
          className={`${styles.sticky} ${styles.stickyPlain} ${styles.fitNote} ${styles.tiltRightSoft}`}
        >
          <h3 className={styles.fitTitle}>{text("Maybe not if")}</h3>
          <ul className={styles.list}>
            <li className={styles.bullet}>
              {text("you want prose only, no React at all (try Starlight or VitePress)")}{" "}
            </li>
            <li className={styles.bullet}>
              {text("you need hosted editing and analytics (a hosted platform does that)")}{" "}
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

const PRINCIPLES = [
  ["One component model.", "Pages and examples are React. No second UI framework."],
  ["Your repo is the source.", "Content, config and theme go through code review."],
  ["Static files, no platform.", "No account, no service to keep alive."],
  ["Claims you can check.", "Public feature status and published benchmarks."],
] as const

export function WhyArdo() {
  return (
    <section className={`${styles.wrap} ${styles.section}`}>
      <div className={styles.whyColumn}>
        <NoteLabel>{text("whoo made this?")}</NoteLabel>
        <blockquote className={styles.quote}>
          {text(
            "“I went looking for a modern, lightweight docs framework that was simply React. It didn’t exist. So I built it.”"
          )}{" "}
        </blockquote>
        <p className={styles.quoteBy}>
          <span className={styles.signature}>Sebastian</span>
          <span className={styles.muted}>{text("Sebastian Werner · creator and maintainer")}</span>
        </p>
        <ol className={styles.principles}>
          {PRINCIPLES.map(([title, text], index) => (
            <li key={title}>
              <span className={styles.principleNumber}>{index + 1}.</span>{" "}
              <strong>{textCopy(title)}</strong> {textCopy(text)}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
