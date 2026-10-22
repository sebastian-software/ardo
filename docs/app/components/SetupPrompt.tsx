import { ArdoCopyButton } from "ardo/ui"

import { SETUP_PROMPT } from "../home/CopyPromptButton"
import * as styles from "./setup-prompt.css"

/** The one-sentence setup prompt with a copy button, shared with the home page. */
export function SetupPrompt() {
  return (
    <div className={styles.frame}>
      <p className={styles.prompt}>{SETUP_PROMPT}</p>
      <ArdoCopyButton code={SETUP_PROMPT} />
    </div>
  )
}
