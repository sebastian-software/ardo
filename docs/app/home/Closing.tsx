import { Link } from "react-router"

import mascot from "../assets/mascot.webp"
import sebastianConsulting from "../assets/home/sebastian-consulting.svg"
import sebastianSoftware from "../assets/home/sebastian-software.svg"
import { CopyPromptButton } from "./CopyPromptButton"
import { Footprints } from "./doodles"
import * as styles from "./home.css"
import { NPM_PACKAGE_URL, type NpmFacts } from "./npm-facts"

const GITHUB_URL = "https://github.com/sebastian-software/ardo"
const CHANGELOG_URL =
  "https://github.com/sebastian-software/ardo/blob/main/packages/ardo/CHANGELOG.md"

export function FinalCallToAction() {
  return (
    <section className={`${styles.wrap} ${styles.finalSection}`}>
      <div className={styles.finalCard}>
        <div
          className={`${styles.hideSmall} ${styles.peekWindow} ${styles.peeking}`}
          aria-hidden="true"
        >
          <img className={styles.peekOwl} src={mascot} alt="" width={720} height={747} />
        </div>
        <span className={`${styles.tape} ${styles.tapeFinal}`} />
        <h2 className={`${styles.h2} ${styles.finalTitle}`}>Ready to hatch your docs?</h2>
        <p className={styles.lead}>
          One sentence for your agent, the official instructions, a tested example. You review the
          result like any other pull request.
        </p>
        <div className={styles.buttonRow}>
          <CopyPromptButton label="Copy the setup prompt" />
          <Link className={styles.button} to="/guide/getting-started">
            Read the docs
          </Link>
        </div>
      </div>
    </section>
  )
}

export function CompanyCards({ facts }: { facts: NpmFacts | null }) {
  return (
    <section className={`${styles.wrap} ${styles.dashedTop} ${styles.companySection}`}>
      <div className={styles.cardPair}>
        <div className={`${styles.businessCard} ${styles.tiltLeft}`}>
          <span className={`${styles.tape} ${styles.tapeLeftSmall}`} />
          <p className={styles.cardKicker}>powered by</p>
          <img
            className={styles.companyLogo}
            src={sebastianSoftware}
            alt="Sebastian Software"
            width={270}
            height={53}
          />
          <p className={styles.cardCopy}>
            Ardo is open source by Sebastian Software, together with Ferromark, Ferriki and the rest
            of the family.
          </p>
          <p className={styles.cardLink}>
            <a href="https://oss.sebastian-software.com">More open source →</a>
          </p>
        </div>
        <div className={`${styles.businessCard} ${styles.tiltRightSoft}`}>
          <span className={`${styles.tape} ${styles.tapeGreen} ${styles.tapeRightSmall}`} />
          <p className={styles.cardKicker}>need a hand?</p>
          <img
            className={styles.companyLogo}
            src={sebastianConsulting}
            alt="Sebastian Consulting"
            width={280}
            height={53}
          />
          <p className={styles.cardCopy}>
            TypeScript, React and Rust consulting: integration, support and long-term maintenance
            from the people who build Ardo.
          </p>
          <p className={styles.cardLink}>
            <a href="https://sebastian-consulting.com">Work with us →</a>
          </p>
        </div>
      </div>
      <div className={`${styles.smallPrint} ${styles.releaseRow}`}>
        {facts === null ? null : (
          <span>
            Latest release{" "}
            <a className={styles.mono} href={`${NPM_PACKAGE_URL}?activeTab=versions`}>
              {facts.version}
            </a>
          </span>
        )}
        <a href={CHANGELOG_URL}>Changelog</a>
        <a href={NPM_PACKAGE_URL}>npm</a>
        <a href={GITHUB_URL}>GitHub</a>
        <span className={styles.owlSaysHi}>
          <Footprints steps={2} />
          <span className={styles.handNote}>the owl says hi</span>
        </span>
      </div>
    </section>
  )
}
