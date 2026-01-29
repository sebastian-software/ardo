import { createFileRoute, Outlet } from '@tanstack/react-router'
import { DocLayout } from 'ardo/theme'
import { PressProvider } from 'ardo/runtime'
import config from 'virtual:ardo/config'
import sidebar from 'virtual:ardo/sidebar'

export const Route = createFileRoute('/guide/_layout')({
  component: GuideLayoutComponent,
})

function GuideLayoutComponent() {
  return (
    <PressProvider config={config} sidebar={sidebar}>
      <DocLayout>
        <Outlet />
      </DocLayout>
    </PressProvider>
  )
}
