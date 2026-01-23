import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  // Don't set basepath here - TanStack Start manages it from Vite's base config
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  })
}

export type AppRouter = ReturnType<typeof getRouter>

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter
  }
}
