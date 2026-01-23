import { useThemeConfig } from '../runtime/hooks'

export function Footer() {
  const themeConfig = useThemeConfig()

  if (!themeConfig.footer) {
    return null
  }

  return (
    <footer className="press-footer">
      <div className="press-footer-container">
        {themeConfig.footer.message && (
          <p
            className="press-footer-message"
            dangerouslySetInnerHTML={{ __html: themeConfig.footer.message }}
          />
        )}
        {themeConfig.footer.copyright && (
          <p
            className="press-footer-copyright"
            dangerouslySetInnerHTML={{ __html: themeConfig.footer.copyright }}
          />
        )}
      </div>
    </footer>
  )
}
