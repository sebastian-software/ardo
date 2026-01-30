/**
 * Post-build script to flatten the prerendered HTML files.
 *
 * When using `basename: "/ardo/"` in react-router.config.ts,
 * React Router outputs HTML files to build/client/ardo/.
 * This script moves them to build/client/ for correct GitHub Pages deployment.
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const buildDir = path.join(__dirname, "..", "build", "client")
const nestedDir = path.join(buildDir, "ardo")

if (!fs.existsSync(nestedDir)) {
  console.log("[flatten] No nested ardo/ directory found, skipping.")
  process.exit(0)
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src)

  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item))
    }
  } else {
    fs.copyFileSync(src, dest)
  }
}

console.log("[flatten] Moving HTML files from build/client/ardo/ to build/client/")

// Copy all files from nested directory to parent
copyRecursive(nestedDir, buildDir)

// Remove the nested directory
fs.rmSync(nestedDir, { recursive: true, force: true })

console.log("[flatten] Done.")
