import collections from "virtual:ardo/collections"

export default function CatalogPage() {
  const recipes = collections.recipes ?? []

  return (
    <main>
      <h1>Recipe catalog</h1>
      <p>
        This page reads the same static collection that supplies the generated documentation routes.
      </p>
      <ul>
        {recipes.map((recipe) => (
          <li key={recipe.sourcePath}>
            <strong>{String(recipe.data.title)}</strong>: {String(recipe.data.summary)}
          </li>
        ))}
      </ul>
    </main>
  )
}
