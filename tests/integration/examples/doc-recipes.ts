import fs from "node:fs"
import path from "node:path"
import { expect } from "vitest"

import { repositoryRoot } from "./project"

function example(guide: string, marker: string): string {
  const source = fs.readFileSync(
    path.join(repositoryRoot, `docs/app/routes/guide/${guide}.mdx`),
    "utf8"
  )
  const blocks = source.matchAll(/^```tsx?[^\n]*\n([\s\S]*?)^```[ \t]*$/gmu)
  for (const block of blocks) {
    if (block[1].includes(marker)) return block[1]
  }
  throw new Error(`Missing ${guide} example containing ${marker}`)
}

/** Exercise the authored recipes without exposing workspace-only dependencies. */
export function assertDocRecipes(
  consumer: string,
  run: (cwd: string, args: string[]) => string
): void {
  const write = (file: string, source: string) => {
    const destination = path.join(consumer, file)
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    fs.writeFileSync(destination, source)
  }
  write("vite.config.ts", example("upgrade-to-v6", "function releaseFacts"))
  run(consumer, ["exec", "tsc", "--noEmit"])
  // The example fetches release data; only its public type contract needs execution here.
  fs.rmSync(path.join(consumer, "vite.config.ts"))

  write("app/components/tailwind-home.tsx", example("tailwind", "export default function Home"))
  write("app/components/launch-link.tsx", example("custom-theme", "export function LaunchLink"))
  write(
    "app/components/edit-link.tsx",
    `${example("custom-theme", "function MyEditLink")}\nexport { MyEditLink };\n`
  )
  write(
    "ardo.config.ts",
    `import { defineArdoConfig } from "ardo/config";
export default defineArdoConfig({ title: "Recipe checks", githubPages: false, base: "/repo/" });
`
  )
  write(
    "app/routes/home.tsx",
    `import { ArdoProvider, ArdoSiteConfigProvider } from "ardo/runtime";
import TailwindHome from "../components/tailwind-home";
import { LaunchLink } from "../components/launch-link";
import { MyEditLink } from "../components/edit-link";

const site = { editLink: { pattern: "https://github.com/example/docs/edit/main/:path" } };
const page = {
  title: "Recipe checks", frontmatter: {}, toc: [], content: "",
  filePath: "guide/space name.md", relativePath: "guide/space name.md",
};
export default function Home() {
  return <>
    <TailwindHome />
    <LaunchLink />
    <ArdoSiteConfigProvider value={site}>
      <ArdoProvider config={{ title: "Recipe checks" }} sidebar={[]} currentPage={page}><MyEditLink /></ArdoProvider>
      <ArdoProvider config={{ title: "Recipe checks" }} sidebar={[]} currentPage={{ ...page, relativePath: "hidden.md", frontmatter: { editLink: false } }}><MyEditLink /></ArdoProvider>
      <ArdoProvider config={{ title: "Recipe checks" }} sidebar={[]}><MyEditLink /></ArdoProvider>
    </ArdoSiteConfigProvider>
  </>;
}
`
  )
  run(consumer, ["exec", "tsc", "--noEmit"])
  expect(run(consumer, ["build"])).not.toContain("broken internal link")
  const home = fs.readFileSync(path.join(consumer, "build/client/index.html"), "utf8")
  expect(home).toContain('href="/repo/guide/getting-started/"')
  expect(home).not.toContain('href="/guide/getting-started"')
  expect(home).toContain('href="https://github.com/example/docs/edit/main/guide/space%20name.md"')
  expect(home).not.toContain('href="https://github.com/example/docs/edit/main/hidden.md"')
  expect(home).not.toContain('href="https://github.com/example/docs/edit/main/:path"')
}
