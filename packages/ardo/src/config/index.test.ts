import { describe, it, expect } from 'vitest'
import { defineConfig, resolveConfig } from './index'

describe('defineConfig', () => {
  it('returns the config unchanged', () => {
    const config = {
      title: 'Test Docs',
      description: 'A test documentation site',
    }

    const result = defineConfig(config)

    expect(result).toEqual(config)
  })

  it('preserves all config properties', () => {
    const config = {
      title: 'My Docs',
      description: 'Description',
      base: '/docs/',
      srcDir: 'documentation',
      themeConfig: {
        nav: [{ text: 'Home', link: '/' }],
      },
    }

    const result = defineConfig(config)

    expect(result.title).toBe('My Docs')
    expect(result.base).toBe('/docs/')
    expect(result.srcDir).toBe('documentation')
    expect(result.themeConfig?.nav).toHaveLength(1)
  })
})

describe('resolveConfig', () => {
  it('resolves config with defaults', () => {
    const config = {
      title: 'Test',
    }

    const resolved = resolveConfig(config, '/project')

    expect(resolved.title).toBe('Test')
    expect(resolved.description).toBe('')
    expect(resolved.base).toBe('/')
    expect(resolved.srcDir).toBe('content')
    expect(resolved.outDir).toBe('dist')
    expect(resolved.lang).toBe('en')
    expect(resolved.contentDir).toBe('/project/content')
  })

  it('uses provided values over defaults', () => {
    const config = {
      title: 'Custom',
      description: 'Custom description',
      base: '/custom/',
      srcDir: 'docs',
      outDir: 'build',
      lang: 'de',
    }

    const resolved = resolveConfig(config, '/project')

    expect(resolved.title).toBe('Custom')
    expect(resolved.description).toBe('Custom description')
    expect(resolved.base).toBe('/custom/')
    expect(resolved.srcDir).toBe('docs')
    expect(resolved.outDir).toBe('build')
    expect(resolved.lang).toBe('de')
    expect(resolved.contentDir).toBe('/project/docs')
  })

  it('merges theme config with defaults', () => {
    const config = {
      title: 'Test',
      themeConfig: {
        siteTitle: 'My Site',
        nav: [{ text: 'Guide', link: '/guide' }],
      },
    }

    const resolved = resolveConfig(config, '/project')

    expect(resolved.themeConfig.siteTitle).toBe('My Site')
    expect(resolved.themeConfig.nav).toHaveLength(1)
    expect(resolved.themeConfig.search?.enabled).toBe(true)
    expect(resolved.themeConfig.outline?.level).toBe(2)
  })

  it('merges markdown config with defaults', () => {
    const config = {
      title: 'Test',
      markdown: {
        lineNumbers: true,
      },
    }

    const resolved = resolveConfig(config, '/project')

    expect(resolved.markdown.lineNumbers).toBe(true)
    expect(resolved.markdown.theme).toEqual({ light: 'github-light', dark: 'github-dark' })
    expect(resolved.markdown.anchor).toBe(true)
  })

  it('handles head config', () => {
    const config = {
      title: 'Test',
      head: [{ tag: 'meta', attrs: { name: 'author', content: 'Test Author' } }],
    }

    const resolved = resolveConfig(config, '/project')

    expect(resolved.head).toHaveLength(1)
    expect(resolved.head[0]).toEqual({
      tag: 'meta',
      attrs: { name: 'author', content: 'Test Author' },
    })
  })
})
