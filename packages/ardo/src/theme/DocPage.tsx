import { type ReactNode } from 'react'
import { usePageData } from '../runtime/hooks'
import { Layout } from './Layout'
import { Content } from './Content'
import { TOC } from './TOC'

interface DocPageProps {
  children: ReactNode
}

export function DocPage({ children }: DocPageProps) {
  const pageData = usePageData()
  const showToc =
    pageData?.frontmatter.outline !== false && pageData?.toc && pageData.toc.length > 0

  return (
    <Layout>
      <div className="press-doc-page">
        <Content>{children}</Content>
        {showToc && <TOC />}
      </div>
    </Layout>
  )
}

interface DocLayoutProps {
  content: ReactNode
}

export function DocLayout({ content }: DocLayoutProps) {
  return <DocPage>{content}</DocPage>
}
