export const packageManagers = ["npm", "pnpm", "yarn", "bun"] as const
export type PackageManager = (typeof packageManagers)[number]

export type PackageManagerCommands = {
  build: string
  dev: string
  install: string
  preview: string
}

export function isPackageManager(value: string): value is PackageManager {
  return value === "npm" || value === "pnpm" || value === "yarn" || value === "bun"
}

export function resolvePackageManager(env: NodeJS.ProcessEnv = process.env): PackageManager {
  const userAgent = env.npm_config_user_agent ?? ""
  const detectedFromUserAgent = userAgent.split(/[ /]/)[0]
  if (isPackageManager(detectedFromUserAgent)) {
    return detectedFromUserAgent
  }

  const execPath = env.npm_execpath ?? ""
  if (execPath.includes("pnpm")) return "pnpm"
  if (execPath.includes("yarn")) return "yarn"
  if (execPath.includes("bun")) return "bun"
  if (execPath.includes("npm")) return "npm"

  return "pnpm"
}

export function getPackageManagerCommands(packageManager: PackageManager): PackageManagerCommands {
  switch (packageManager) {
    case "bun":
      return {
        build: "bun run build",
        dev: "bun run dev",
        install: "bun install",
        preview: "bun run preview",
      }
    case "npm":
      return {
        build: "npm run build",
        dev: "npm run dev",
        install: "npm install",
        preview: "npm run preview",
      }
    case "yarn":
      return {
        build: "yarn build",
        dev: "yarn dev",
        install: "yarn install",
        preview: "yarn preview",
      }
    case "pnpm":
      return {
        build: "pnpm build",
        dev: "pnpm dev",
        install: "pnpm install",
        preview: "pnpm preview",
      }
  }
}
