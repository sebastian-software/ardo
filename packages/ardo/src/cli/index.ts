#!/usr/bin/env node

import { isDirectCliInvocation, runCliEntrypoint } from "./run"

if (isDirectCliInvocation(import.meta.url)) runCliEntrypoint(process.argv.slice(2))

export { runCliEntrypoint } from "./run"
