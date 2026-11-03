import { describe, expect, it } from "vitest"

import { listRecipes } from "./add"

const stepHeadings = [
  /^Check the existing setup$/u,
  /^Inspect the project$/u,
  /^Confirm the plan$/u,
  /^Apply the change$/u,
  /^Verify$/u,
]

describe("shipped agent recipes", () => {
  const recipes = listRecipes()

  it("ships exactly the first three recipes", () => {
    expect(recipes.map((recipe) => recipe.name)).toStrictEqual([
      "api-reference",
      "locale",
      "version",
    ])
  })

  it.each(recipes.map((recipe) => [recipe.name, recipe] as const))(
    "%s has valid frontmatter and one H1 title",
    (_name, recipe) => {
      expect(recipe.markdown.startsWith("---\n")).toBe(true)
      expect(recipe.description.trim()).not.toBe("")
      expect(recipe.description).not.toContain("\n")
      expect(recipe.markdown.match(/^# /gmu)).toHaveLength(1)
    }
  )

  it.each(recipes.map((recipe) => [recipe.name, recipe] as const))(
    "%s follows the five steps in order",
    (_name, recipe) => {
      const headings = [...recipe.markdown.matchAll(/^## (.+)$/gmu)].map((match) =>
        String(match[1])
      )
      expect(headings).toHaveLength(stepHeadings.length)
      stepHeadings.forEach((pattern, index) => {
        expect(headings[index]).toMatch(pattern)
      })
    }
  )

  it.each(recipes.map((recipe) => [recipe.name, recipe] as const))(
    "%s checks for an existing setup and stops before it edits anything",
    (_name, recipe) => {
      expect(recipe.markdown).toMatch(
        /## Check the existing setup\n[\s\S]*\bstop\b[\s\S]*## Inspect the project/u
      )
    }
  )

  it.each(recipes.map((recipe) => [recipe.name, recipe] as const))(
    "%s verifies with the build and mentions ardo check only as optional",
    (_name, recipe) => {
      expect(recipe.markdown).toMatch(/## Verify[\s\S]*pnpm build/u)
      expect(recipe.markdown).toMatch(/## Verify[\s\S]*`ardo check` is available/u)
    }
  )
})
