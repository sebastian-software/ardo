import { renderToReadableStream } from "react-dom/server"
import { type EntryContext, ServerRouter } from "react-router"

export const streamTimeout = 5000

/** Render a complete documentation response with Ardo's shared React runtime. */
// eslint-disable-next-line max-params -- React Router defines this server entry signature.
export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
): Promise<Response> {
  responseHeaders.set("Content-Type", "text/html")
  if (request.method === "HEAD") {
    return new Response(null, { status: responseStatusCode, headers: responseHeaders })
  }

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: AbortSignal.timeout(streamTimeout + 1000),
      onError(error: unknown) {
        console.error(error)
        responseStatusCode = 500
      },
    }
  )
  // Return complete documentation HTML after all suspended routes have rendered.
  await body.allReady
  return new Response(body, { status: responseStatusCode, headers: responseHeaders })
}
