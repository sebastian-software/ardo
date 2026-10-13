export const handle = { layout: "bare", chrome: false }

export default function BarePage() {
  return (
    <>
      <header style={{ position: "sticky", top: 0, background: "white" }}>
        <a href="#bare-content">Skip to content</a>
        <h1>Custom site chrome</h1>
      </header>
      <section id="bare-content" style={{ minHeight: "150vh" }}>
        Full-width bare content
      </section>
      <footer>Custom site footer</footer>
    </>
  )
}
