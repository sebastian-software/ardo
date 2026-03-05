import { createGlobalTheme } from "@vanilla-extract/css"

import { vars } from "./contract.css"
import { lightTokens } from "./tokens"

createGlobalTheme(":root", vars, lightTokens)
