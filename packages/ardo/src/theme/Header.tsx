import { useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ThemeToggle } from './components/ThemeToggle'
import { Search } from './components/Search'

// =============================================================================
// Header Component
// =============================================================================

export interface HeaderProps {
  /** Logo image URL or light/dark variants */
  logo?: string | { light: string; dark: string }
  /** Site title displayed next to logo */
  title?: string
  /** Navigation content (Nav component or custom) */
  nav?: ReactNode
  /** Actions/right side content (social links, custom buttons) */
  actions?: ReactNode
  /** Show search (default: true) */
  search?: boolean
  /** Show theme toggle (default: true) */
  themeToggle?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Header component with explicit slot props.
 *
 * @example
 * ```tsx
 * <Header
 *   logo="/logo.svg"
 *   title="Ardo"
 *   nav={
 *     <Nav>
 *       <NavLink to="/guide">Guide</NavLink>
 *       <NavLink to="/api">API</NavLink>
 *     </Nav>
 *   }
 *   actions={
 *     <SocialLink href="https://github.com/..." icon="github" />
 *   }
 * />
 * ```
 */
export function Header({
  logo,
  title,
  nav,
  actions,
  search = true,
  themeToggle = true,
  className,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className={className ?? 'press-header'}>
      <div className="press-header-container">
        {/* Left: Mobile menu button + Logo/Title */}
        <div className="press-header-left">
          <button
            className="press-mobile-menu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="press-hamburger">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>

          <Link to="/" className="press-logo-link">
            {logo && (
              <img
                src={typeof logo === 'string' ? logo : logo.light}
                alt={title ?? 'Logo'}
                className="press-logo"
              />
            )}
            {title && <span className="press-site-title">{title}</span>}
          </Link>
        </div>

        {/* Center: Navigation */}
        {nav && <div className="press-nav">{nav}</div>}

        {/* Right: Search, Theme Toggle, Actions */}
        <div className="press-header-right">
          {search && <Search />}
          {themeToggle && <ThemeToggle />}
          {actions}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="press-mobile-menu">
          <nav className="press-mobile-nav" onClick={() => setMobileMenuOpen(false)}>
            {nav}
          </nav>
        </div>
      )}
    </header>
  )
}

// =============================================================================
// SocialLink Component
// =============================================================================

export interface SocialLinkProps {
  /** URL to link to */
  href: string
  /** Social icon type */
  icon: 'github' | 'twitter' | 'discord' | 'linkedin' | 'youtube' | 'npm'
  /** Accessible label */
  ariaLabel?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Social media link with icon.
 *
 * @example
 * ```tsx
 * <SocialLink href="https://github.com/..." icon="github" />
 * ```
 */
export function SocialLink({ href, icon, ariaLabel, className }: SocialLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? 'press-social-link'}
      aria-label={ariaLabel ?? icon}
    >
      <SocialIcon icon={icon} />
    </a>
  )
}

// =============================================================================
// Social Icon Component (internal)
// =============================================================================

function SocialIcon({ icon }: { icon: string }) {
  const icons: Record<string, string> = {
    github:
      'M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z',
    twitter:
      'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z',
    discord:
      'M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z',
    linkedin:
      'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
    youtube:
      'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
    npm: 'M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z',
  }

  const path = icons[icon] || icons.github

  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d={path} />
    </svg>
  )
}
