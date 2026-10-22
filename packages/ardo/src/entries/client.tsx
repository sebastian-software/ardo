import { hydrateRoot } from "react-dom/client"
import { rootModule, routes } from "virtual:ardo/routes"

import { ArdoApp } from "../runtime/app"
import {
  ARDO_APP_ELEMENT_ID,
  ARDO_PAGE_DATA_ATTRIBUTE,
  type ArdoPageData,
  type ArdoRootModule,
  resolvePage,
} from "../runtime/routing"

const container = document.getElementById(ARDO_APP_ELEMENT_ID)
const pageData = container?.getAttribute(ARDO_PAGE_DATA_ATTRIBUTE)

// Hydrate with the same route module the server rendered for this page.
if (container != null && pageData != null) {
  // The server wrote this description of the page it rendered.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const data = JSON.parse(pageData) as ArdoPageData
  const root: ArdoRootModule = rootModule
  const route = routes.find((entry) => entry.id === data.routeId)
  const page = await resolvePage({ ...data, root, route })
  hydrateRoot(container, <ArdoApp page={page} root={root} routes={routes} />)
}
