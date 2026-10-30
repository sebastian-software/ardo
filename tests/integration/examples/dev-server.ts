import { spawn, type ChildProcess } from "node:child_process"
import { createConnection, createServer } from "node:net"
import { setTimeout as delay } from "node:timers/promises"
import { expect } from "vitest"

const devHost = "127.0.0.1"

async function getAvailablePort(): Promise<number> {
  const server = createServer()
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, devHost, resolve)
  })
  const address = server.address()
  if (address == null || typeof address === "string") {
    await new Promise<void>((resolve) => server.close(() => resolve()))
    throw new Error("Could not determine a free port for the Ardo server smoke test")
  }
  const port = address.port
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error == null ? resolve() : reject(error)))
  })
  return port
}

function isPortReady(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: devHost, port })
    const finish = (connected: boolean) => {
      socket.destroy()
      resolve(connected)
    }
    socket.setTimeout(500)
    socket.once("connect", () => finish(true))
    socket.once("error", () => finish(false))
    socket.once("timeout", () => finish(false))
  })
}

async function waitForDevServer(
  child: ChildProcess,
  port: number,
  getOutput: () => string,
  getSpawnError: () => Error | undefined,
  timeoutMs = 90_000
): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const spawnError = getSpawnError()
    if (spawnError != null) throw spawnError
    if (child.exitCode != null || child.signalCode != null) {
      throw new Error(
        `Ardo server exited before listening (code ${child.exitCode ?? child.signalCode}).\n${getOutput()}`
      )
    }
    if (await isPortReady(port)) return
    await delay(200)
  }
  throw new Error(
    `Ardo server did not listen on port ${port} within ${timeoutMs} ms.\n${getOutput()}`
  )
}

function signalDevServer(child: ChildProcess, signal: NodeJS.Signals): void {
  if (child.pid == null || child.exitCode != null || child.signalCode != null) return
  try {
    if (process.platform === "win32") child.kill(signal)
    else process.kill(-child.pid, signal)
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ESRCH")) throw error
  }
}

function waitForChildExit(child: ChildProcess, timeoutMs: number): Promise<boolean> {
  if (child.exitCode != null || child.signalCode != null) return Promise.resolve(true)
  return new Promise((resolve) => {
    let timer: NodeJS.Timeout
    const onExit = () => {
      clearTimeout(timer)
      resolve(true)
    }
    timer = setTimeout(() => {
      child.off("exit", onExit)
      resolve(false)
    }, timeoutMs)
    child.once("exit", onExit)
  })
}

async function stopDevServer(child: ChildProcess): Promise<void> {
  if (child.pid == null || child.exitCode != null || child.signalCode != null) return
  signalDevServer(child, "SIGTERM")
  if (await waitForChildExit(child, 5_000)) return
  signalDevServer(child, "SIGKILL")
  if (!(await waitForChildExit(child, 5_000))) {
    throw new Error("Ardo server process did not stop after SIGKILL")
  }
}

type ServerExpectation = {
  afterFirstResponse?: (context: { origin: string; html: string }) => Promise<void>
  title?: string
  responseHeader?: { name: string; value: string }
  pathname?: string
  args?: string[]
  pages?: { pathname: string; contains: string[] }[]
}

async function assertServerSSR(
  consumer: string,
  command: "dev" | "preview",
  expected?: ServerExpectation
): Promise<void> {
  const port = await getAvailablePort()
  let serverOutput = ""
  let spawnError: Error | undefined
  let failure: unknown
  const child = spawn(
    "pnpm",
    [
      "--config.verifyDepsBeforeRun=false",
      "exec",
      "ardo",
      command,
      "--host",
      devHost,
      "--port",
      String(port),
      "--strictPort",
      ...(expected?.args ?? []),
    ],
    {
      cwd: consumer,
      detached: process.platform !== "win32",
      env: { ...process.env, CI: "true" },
      stdio: ["ignore", "pipe", "pipe"],
    }
  )
  const appendOutput = (chunk: Buffer) => {
    serverOutput = (serverOutput + chunk.toString()).slice(-12_000)
  }
  child.once("error", (error) => {
    spawnError = error
  })
  child.stdout?.on("data", appendOutput)
  child.stderr?.on("data", appendOutput)

  try {
    await waitForDevServer(
      child,
      port,
      () => serverOutput,
      () => spawnError
    )

    // A TCP readiness probe above avoids consuming the first HTTP request, which
    // must exercise the project's initial dev SSR dependency graph.
    const response = await fetch(`http://${devHost}:${port}${expected?.pathname ?? "/"}`, {
      signal: AbortSignal.timeout(60_000),
    })
    const html = await response.text()
    expect(response.status, `First server response: ${html.slice(0, 2_000)}`).toBe(200)
    const normalizedHtml = html.replace(/<!--.*?-->/gs, "")
    expect(normalizedHtml).toContain("Count: 0")
    if (expected?.title != null) expect(normalizedHtml).toContain(expected.title)
    if (expected?.responseHeader != null) {
      expect(response.headers.get(expected.responseHeader.name)).toBe(expected.responseHeader.value)
    }
    await expected?.afterFirstResponse?.({ origin: `http://${devHost}:${port}`, html })

    for (const page of expected?.pages ?? []) {
      const pageResponse = await fetch(`http://${devHost}:${port}${page.pathname}`, {
        signal: AbortSignal.timeout(60_000),
      })
      const pageHtml = await pageResponse.text()
      expect(pageResponse.status, `${page.pathname}: ${pageHtml.slice(0, 2_000)}`).toBe(200)
      for (const content of page.contains) expect(pageHtml).toContain(content)
    }
  } catch (error) {
    failure = error
  } finally {
    await stopDevServer(child)
  }

  if (failure != null) {
    throw new Error(
      [
        failure instanceof Error ? (failure.stack ?? failure.message) : String(failure),
        serverOutput.length === 0 ? "" : `Ardo ${command} output (tail):\n${serverOutput}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      { cause: failure }
    )
  }
}

export async function assertDevSSR(consumer: string, expected?: ServerExpectation): Promise<void> {
  await assertServerSSR(consumer, "dev", expected)
}

export async function assertPreviewSSR(
  consumer: string,
  pathname: string | ServerExpectation,
  args: string[] = []
): Promise<void> {
  await assertServerSSR(
    consumer,
    "preview",
    typeof pathname === "string" ? { pathname, args } : pathname
  )
}
