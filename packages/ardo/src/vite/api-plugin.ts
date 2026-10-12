import type { Plugin } from "vite"

import type { NativeApiDocsConfig } from "../api/types"

import { ApiPluginState } from "./api-session"

type ApiPluginGroup = { outputs: string[]; initializing: Set<ApiPluginState> }

export function addApiPlugin(
  plugins: Plugin[],
  options: { api?: NativeApiDocsConfig | NativeApiDocsConfig[] | true; routesDirOption?: string }
): void {
  const { api, routesDirOption } = options
  if (api == null) return
  const projects = Array.isArray(api) ? api : [api]
  if (projects.length === 0) throw new Error("[ardo] api must contain at least one project.")
  const outputs = projects.map((project) =>
    project === true ? "api-reference" : (project.out ?? "api-reference")
  )
  const group: ApiPluginGroup = { outputs, initializing: new Set() }
  plugins.unshift(
    ...projects.map((project, index) =>
      createApiPlugin(project, routesDirOption, { group, first: index === 0 })
    )
  )
}

export function createApiPlugin(
  options: NativeApiDocsConfig | true,
  routesDirOption?: string,
  registration?: { group: ApiPluginGroup; first: boolean }
): Plugin {
  const group = registration?.group ?? {
    outputs: [options === true ? "api-reference" : (options.out ?? "api-reference")],
    initializing: new Set(),
  }
  const first = registration?.first ?? true
  let state = new ApiPluginState(options, routesDirOption, group.outputs)
  const sessions = new WeakMap<object, ApiPluginState>()
  return {
    name: "ardo:api",
    enforce: "pre",
    async config(userConfig, env) {
      if (first) group.initializing.clear()
      if (state.attached || state.stopped)
        state = new ApiPluginState(options, routesDirOption, group.outputs)
      group.initializing.add(state)
      try {
        await state.initialize(userConfig, env)
      } catch (error) {
        const cleanup = await Promise.allSettled(
          [...group.initializing].map(async (session) => session.stop())
        )
        for (const result of cleanup) {
          if (result.status === "rejected")
            console.warn("[ardo:api] Compiler cleanup after initialization failure:", result.reason)
        }
        throw error
      }
    },
    configureServer(server) {
      state.attach(server)
      for (const environment of Object.values(server.environments)) sessions.set(environment, state)
    },
    async closeBundle() {
      await sessionForContext(this, sessions, state)?.stop()
    },
  }
}

function sessionForContext(
  context: { environment?: object },
  sessions: WeakMap<object, ApiPluginState>,
  fallback: ApiPluginState
): ApiPluginState | undefined {
  return context.environment == null ? fallback : sessions.get(context.environment)
}
