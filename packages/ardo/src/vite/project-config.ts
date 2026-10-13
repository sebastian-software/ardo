import type {
  ConfigEnv,
  PluginOption,
  UserConfig,
  UserConfigExport,
  UserConfigFnPromise,
} from "vite"

import path from "node:path"

import type { ArdoProjectConfigExport } from "../config/project"
import type { ArdoPluginOptions } from "./plugin-options"

import { ardoPlugin } from "./plugin"

type ConfigExport<T extends object> = ((environment: ConfigEnv) => Promise<T> | T) | Promise<T> | T

type ProjectConfigSources = {
  ardoConfigPath?: string
  viteConfigPath?: string
}

type ProjectConfigOptions = {
  ardoConfig?: ArdoProjectConfigExport
  viteConfig?: UserConfigExport
  sources?: ProjectConfigSources
}

/** Create the Vite config callback used by Ardo's project config wrapper. */
export function createArdoProjectViteConfig(
  root: string,
  options: ProjectConfigOptions = {}
): UserConfigFnPromise {
  const projectRoot = path.resolve(root)
  const { ardoConfig: ardoConfigExport, viteConfig: viteConfigExport, sources = {} } = options

  return async (environment) => {
    const viteConfig = await resolveConfigExport<UserConfig>({
      configExport: viteConfigExport,
      environment,
      fallback: {},
      sourcePath: sources.viteConfigPath,
      label: "Vite config",
      expected: "a Vite config object or a function returning one",
    })
    const includesArdo = await hasArdoPlugin(viteConfig.plugins)

    if (includesArdo && (ardoConfigExport !== undefined || sources.ardoConfigPath !== undefined)) {
      throw new Error(
        "[ardo] Both ardo.config and vite.config configure Ardo. Keep Ardo options in ardo.config and remove ardo() from vite.config."
      )
    }
    const ardoOptions = await resolveConfigExport<ArdoPluginOptions>({
      configExport: ardoConfigExport,
      environment,
      fallback: {},
      sourcePath: sources.ardoConfigPath,
      label: "Ardo config",
      expected: "an Ardo options object or a function returning one",
    })

    return {
      ...viteConfig,
      root: viteConfig.root ?? projectRoot,
      plugins: includesArdo
        ? (viteConfig.plugins ?? [])
        : [...(viteConfig.plugins ?? []), ...ardoPlugin(ardoOptions)],
    }
  }
}

type ResolveConfigOptions<T extends object> = {
  configExport: ConfigExport<T> | undefined
  environment: ConfigEnv
  fallback: T
  sourcePath: string | undefined
  label: string
  expected: string
}

async function resolveConfigExport<T extends object>(options: ResolveConfigOptions<T>): Promise<T> {
  if (options.configExport === undefined && options.sourcePath === undefined) {
    return options.fallback
  }

  const configValue = await resolveExportValue(options.configExport, options.environment)
  if (!isConfigObject(configValue)) {
    const source =
      options.sourcePath === undefined ? "" : ` at ${JSON.stringify(options.sourcePath)}`
    throw new Error(`[ardo] Invalid ${options.label}${source}: expected ${options.expected}.`)
  }
  // The guard verifies the structural config container; individual options are validated later.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return configValue as T
}

function resolveExportValue(configExport: unknown, environment: ConfigEnv): unknown {
  if (isConfigCallback(configExport)) return configExport(environment)
  return configExport
}

function isConfigCallback(value: unknown): value is (environment: ConfigEnv) => unknown {
  return typeof value === "function"
}

function isConfigObject(value: unknown): boolean {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

async function hasArdoPlugin(plugins: PluginOption[] | undefined): Promise<boolean> {
  for (const option of plugins ?? []) {
    const resolved = await option
    if (Array.isArray(resolved)) {
      if (await hasArdoPlugin(resolved)) return true
    } else if (isArdoPlugin(resolved)) {
      return true
    }
  }
  return false
}

function isArdoPlugin(option: unknown): boolean {
  return typeof option === "object" && option !== null && "name" in option && option.name === "ardo"
}
