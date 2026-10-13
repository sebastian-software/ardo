#!/usr/bin/env node

import { runCliEntrypoint } from "../dist/cli/index.js"

runCliEntrypoint(process.argv.slice(2))
