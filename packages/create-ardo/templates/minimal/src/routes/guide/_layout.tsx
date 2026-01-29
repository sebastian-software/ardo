import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Layout } from 'ardo/ui'
import { PressProvider } from 'ardo/runtime'
import config from 'virtual:ardo/config'
import sidebar from 'virtual:ardo/sidebar'

export const Route = createFileRoute('/guide/_layout')({
  component: GuideLayoutComponent,
})

function GuideLayoutComponent() {
  return (
    <PressProvider config={config} sidebar={sidebar}>
      <Layout>
        <Outlet />
      </Layout>
    </PressProvider>
  )
}
