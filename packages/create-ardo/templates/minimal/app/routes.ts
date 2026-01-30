import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
  index("routes/home.tsx"),
  route("guide/getting-started", "routes/guide/getting-started.mdx"),
] satisfies RouteConfig
