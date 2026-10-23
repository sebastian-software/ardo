import type { ReactNode } from "ardo/react"

import { ArdoCopyButton } from "ardo/ui"

import { PromptText, SETUP_PROMPT } from "../home/CopyPromptButton"
import * as styles from "./setup-prompt.css"

/**
 * The one-sentence setup prompt with a copy button. The sentence is authored
 * in the MDX, so text exports such as llms-full.txt keep it; the home page's
 * constant is the fallback.
 */
export function SetupPrompt({ children }: { children?: ReactNode }) {
  const prompt = typeof children === "string" ? children : SETUP_PROMPT
  return (
    <div className={styles.frame}>
      <p className={styles.prompt}>
        <PromptText text={prompt} />
      </p>
      <ArdoCopyButton code={prompt} />
    </div>
  )
}
