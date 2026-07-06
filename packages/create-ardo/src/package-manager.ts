export type PackageManager = "bun" | "npm" | "pnpm" | "yarn"

export type PackageManagerCommands = {
  build: string
  dev: string
  install: string
  preview: string
  workflowBuild: string
  workflowInstall: string
  workflowSetup: string
  workflowSetupNodeCache: string
}

export function detectPackageManager(
  userAgent = process.env.npm_config_user_agent
): PackageManager {
  const name = userAgent?.split(" ")[0]?.split("/")[0]
  if (name === "bun" || name === "npm" || name === "pnpm" || name === "yarn") {
    return name
  }
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
        workflowBuild: "bun run build",
        workflowInstall: "bun install --frozen-lockfile",
        workflowSetup: ["      - name: Setup Bun", "        uses: oven-sh/setup-bun@v2"].join("\n"),
        workflowSetupNodeCache: "",
      }
    case "npm":
      return {
        build: "npm run build",
        dev: "npm run dev",
        install: "npm install",
        preview: "npm run preview",
        workflowBuild: "npm run build",
        workflowInstall: "npm ci",
        workflowSetup: "",
        workflowSetupNodeCache: "          cache: 'npm'",
      }
    case "yarn":
      return {
        build: "yarn build",
        dev: "yarn dev",
        install: "yarn install",
        preview: "yarn preview",
        workflowBuild: "yarn build",
        workflowInstall: "yarn install --immutable",
        workflowSetup: ["      - name: Enable Corepack", "        run: corepack enable"].join("\n"),
        workflowSetupNodeCache: "          cache: 'yarn'",
      }
    case "pnpm":
      return {
        build: "pnpm build",
        dev: "pnpm dev",
        install: "pnpm install",
        preview: "pnpm preview",
        workflowBuild: "pnpm build",
        workflowInstall: "pnpm install --frozen-lockfile",
        workflowSetup: ["      - name: Setup pnpm", "        uses: pnpm/action-setup@v4"].join(
          "\n"
        ),
        workflowSetupNodeCache: "          cache: 'pnpm'",
      }
  }
}
