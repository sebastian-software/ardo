import { createGlobalTheme, globalStyle } from "@vanilla-extract/css"

import { vars } from "./contract.css"
import { lightTokens } from "./tokens"

createGlobalTheme(":root", vars, lightTokens)

// The browser draws form controls and scrollbars, and resolves `light-dark()`
// in inline content such as Mermaid diagrams, for the scheme Ardo shows.
globalStyle(":root", { colorScheme: "light" })
