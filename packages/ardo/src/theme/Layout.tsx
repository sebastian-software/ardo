import { type ReactNode } from 'react'
import { useConfig, useThemeConfig } from '../runtime/hooks'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const config = useConfig()
  const themeConfig = useThemeConfig()

  return (
    <div className="press-layout">
      <Header />
      <div className="press-layout-container">
        <Sidebar />
        <main className="press-main">{children}</main>
      </div>
      <Footer />
    </div>
  )
}
