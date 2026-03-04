import { createGlobalTheme } from "@vanilla-extract/css"
import { vars } from "./contract.css"
import { darkTokens } from "./tokens"

createGlobalTheme(".dark", vars, darkTokens)
