import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react"

type MermaidApi = typeof import("mermaid").default
export type MermaidColorMode = "dark" | "light"

let mermaidApiPromise: Promise<MermaidApi> | null = null
const colorModeSubscribers = new Set<() => void>()
let stopColorModeObserver: (() => void) | null = null

export function MermaidDiagram({ chart }: { readonly chart: string }) {
  const id = useStableMermaidId()
  const colorMode = useMermaidColorMode()
  const containerRef = useRef<HTMLDivElement>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const container = containerRef.current

    async function renderDiagram(): Promise<void> {
      try {
        const svg = await renderMermaidSvg(
          chart,
          colorMode,
          `${id}-${colorMode}`,
          controller.signal,
        )
        if (!controller.signal.aborted && containerRef.current !== null) {
          containerRef.current.innerHTML = svg
          setErrorMessage(null)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setErrorMessage(messageFromError(error))
        }
      }
    }

    void renderDiagram()

    return () => {
      controller.abort()
      container?.replaceChildren()
    }
  }, [chart, colorMode, id])

  if (errorMessage !== null) {
    return (
      <pre className="mermaid-error">
        <code>{errorMessage}</code>
      </pre>
    )
  }

  return (
    <div ref={containerRef} className="mermaid-diagram" role="img" aria-label="Mermaid diagram" />
  )
}

export async function renderMermaidSvg(
  chart: string,
  colorMode: MermaidColorMode,
  id: string,
  signal?: AbortSignal,
): Promise<string> {
  signal?.throwIfAborted()
  const mermaid = await loadMermaid()
  signal?.throwIfAborted()
  mermaid.initialize(createMermaidConfig(colorMode))
  const { svg } = await mermaid.render(id, normalizeMermaidChart(chart))
  signal?.throwIfAborted()
  return svg
}

export function normalizeMermaidChart(chart: string): string {
  if (!isFlowchartChart(chart)) {
    return chart
  }

  return chart
    .split("\n")
    .map((line) => normalizeFlowchartTrailingNote(line))
    .join("\n")
}

export function createMermaidConfig(colorMode: MermaidColorMode) {
  const isDark = colorMode === "dark"

  return {
    startOnLoad: false,
    securityLevel: "strict",
    theme: "base",
    themeVariables: {
      background: "transparent",
      darkMode: isDark,
      edgeLabelBackground: isDark ? "#191a17" : "#ffffff",
      lineColor: isDark ? "#a9ada1" : "#65685f",
      mainBkg: isDark ? "#191a17" : "#ffffff",
      nodeBorder: isDark ? "#60b49d" : "#2f6f5e",
      nodeTextColor: isDark ? "#f3f4ed" : "#181916",
      primaryBorderColor: isDark ? "#60b49d" : "#2f6f5e",
      primaryColor: isDark ? "#1f3f37" : "#e8f3ee",
      primaryTextColor: isDark ? "#f3f4ed" : "#181916",
      secondaryColor: isDark ? "#22231f" : "#efefeb",
      tertiaryColor: isDark ? "#111210" : "#f7f7f4",
      textColor: isDark ? "#f3f4ed" : "#181916",
    },
  } as const
}

function loadMermaid(): Promise<MermaidApi> {
  if (mermaidApiPromise === null) {
    mermaidApiPromise = import("mermaid").then((module) => {
      module.default.initialize(createMermaidConfig(readMermaidColorMode()))
      return module.default
    })
  }
  return mermaidApiPromise
}

function isFlowchartChart(chart: string): boolean {
  return /^\s*(?:flowchart|graph)\s+/i.test(chart)
}

function normalizeFlowchartTrailingNote(line: string): string {
  const targetNode = String.raw`[A-Za-z][\w-]*(?:\[[^\]]*\]|\([^)]*\)|\{[^}]*\})?`
  const match = line.match(
    new RegExp(String.raw`^(\s*.+?\s)(-->|---|-.->|==>)(\s*)(${targetNode})(\s+)(note\s+.+)$`, "i"),
  )
  if (match === null) {
    return line
  }

  const [, source = "", connector = "", spacing = "", target = "", , note = ""] = match
  return `${source}${connector}|${note}|${spacing}${target}`
}

export function useMermaidColorMode(): MermaidColorMode {
  return useSyncExternalStore(subscribeMermaidColorMode, readMermaidColorMode, () => "light")
}

export function subscribeMermaidColorMode(subscriber: () => void): () => void {
  colorModeSubscribers.add(subscriber)
  if (stopColorModeObserver === null) {
    stopColorModeObserver = startColorModeObserver()
  }

  return () => {
    colorModeSubscribers.delete(subscriber)
    if (colorModeSubscribers.size === 0) {
      stopColorModeObserver?.()
      stopColorModeObserver = null
    }
  }
}

function startColorModeObserver(): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)")
  const notifySubscribers = () => {
    for (const subscriber of colorModeSubscribers) {
      subscriber()
    }
  }
  const observer = new MutationObserver(notifySubscribers)

  observer.observe(document.documentElement, {
    attributeFilter: ["data-theme"],
    attributes: true,
  })
  media.addEventListener("change", notifySubscribers)

  return () => {
    observer.disconnect()
    media.removeEventListener("change", notifySubscribers)
  }
}

function readMermaidColorMode(): MermaidColorMode {
  const theme = document.documentElement.getAttribute("data-theme")
  if (theme === "dark") {
    return "dark"
  }
  if (theme === "light") {
    return "light"
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function useStableMermaidId(): string {
  return `mding-mermaid-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
}

function messageFromError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return "Unable to render Mermaid diagram."
}
