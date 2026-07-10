import { getCollection } from "virtual:ardo/collections"

type Recipe = {
  summary: string
  title: string
}

export default function CatalogPage() {
  const recipes = getCollection<Recipe>("recipes")

  return (
    <main>
      <h1>Recipe catalog</h1>
      <p>
        This page reads the same static collection that supplies the generated documentation routes.
      </p>
      <ul>
        {recipes.map((recipe) => (
          <li key={recipe.sourcePath}>
            <strong>{recipe.data.title}</strong>: {recipe.data.summary}
          </li>
        ))}
      </ul>
    </main>
  )
}
