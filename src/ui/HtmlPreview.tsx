import { useEffect, useId, useState } from "react"
import { type MermaidColorMode, renderMermaidSvg, useMermaidColorMode } from "./MarkdownPreview"

type HtmlPreviewProps = {
  readonly html: string
}

type HtmlPreviewState = {
  readonly srcDoc: string
}

export function HtmlPreview({ html }: HtmlPreviewProps) {
  const idPrefix = useStableHtmlPreviewId()
  const colorMode = useMermaidColorMode()
  const [preview, setPreview] = useState<HtmlPreviewState>(() => ({
    srcDoc: createLoadingDocument(colorMode),
  }))

  useEffect(() => {
    let cancelled = false

    async function buildPreview(): Promise<void> {
      const srcDoc = await createHtmlPreviewDocument(html, colorMode, idPrefix)
      if (!cancelled) {
        setPreview({ srcDoc })
      }
    }

    void buildPreview()

    return () => {
      cancelled = true
    }
  }, [colorMode, html, idPrefix])

  return <iframe className="html-preview-frame" title="HTML preview" srcDoc={preview.srcDoc} />
}

async function createHtmlPreviewDocument(
  html: string,
  colorMode: MermaidColorMode,
  idPrefix: string,
): Promise<string> {
  const document = new DOMParser().parseFromString(html, "text/html")
  injectPreviewStyle(document, colorMode)
  await renderMermaidBlocks(document, colorMode, idPrefix)
  return `<!doctype html>${document.documentElement.outerHTML}`
}

function createLoadingDocument(colorMode: MermaidColorMode): string {
  const foreground = colorMode === "dark" ? "#f3f4ed" : "#181916"
  const background = colorMode === "dark" ? "#0c0d0b" : "#ffffff"
  return `<!doctype html><html><body style="margin:0;padding:20px;color:${foreground};background:${background};font-family:system-ui,sans-serif">Loading HTML preview...</body></html>`
}

function injectPreviewStyle(document: Document, colorMode: MermaidColorMode): void {
  const style = document.createElement("style")
  style.textContent = previewStyle(colorMode)
  document.head.append(style)
}

async function renderMermaidBlocks(
  document: Document,
  colorMode: MermaidColorMode,
  idPrefix: string,
): Promise<void> {
  const elements = Array.from(
    document.querySelectorAll("pre.mermaid, div.mermaid, code.language-mermaid, code.lang-mermaid"),
  )

  await Promise.all(
    elements.map(async (element, index) => {
      const chart = element.textContent ?? ""
      const replacement = await createMermaidReplacement(
        document,
        chart,
        colorMode,
        idPrefix,
        index,
      )
      mermaidReplaceTarget(element).replaceWith(replacement)
    }),
  )
}

async function createMermaidReplacement(
  document: Document,
  chart: string,
  colorMode: MermaidColorMode,
  idPrefix: string,
  index: number,
): Promise<HTMLElement> {
  try {
    const wrapper = document.createElement("div")
    wrapper.className = "mermaid-diagram"
    wrapper.setAttribute("role", "img")
    wrapper.setAttribute("aria-label", "Mermaid diagram")
    wrapper.innerHTML = await renderMermaidSvg(
      chart,
      colorMode,
      `${idPrefix}-${index}-${colorMode}`,
    )
    return wrapper
  } catch (error) {
    const pre = document.createElement("pre")
    pre.className = "mermaid-error"
    const code = document.createElement("code")
    code.textContent = messageFromError(error)
    pre.append(code)
    return pre
  }
}

function mermaidReplaceTarget(element: Element): Element {
  const parent = element.parentElement
  if (element.tagName.toLowerCase() === "code" && parent?.tagName.toLowerCase() === "pre") {
    return parent
  }
  return element
}

function previewStyle(colorMode: MermaidColorMode): string {
  const isDark = colorMode === "dark"
  const foreground = isDark ? "#f3f4ed" : "#181916"
  const secondary = isDark ? "#a9ada1" : "#65685f"
  const background = isDark ? "#0c0d0b" : "#ffffff"
  const inset = isDark ? "#111210" : "#f7f7f4"
  const border = isDark ? "#31342e" : "#d9dbd2"
  const accent = isDark ? "#60b49d" : "#2f6f5e"

  return `
    :root {
      color-scheme: ${colorMode};
      color: ${foreground};
      background: ${background};
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    body {
      box-sizing: border-box;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      color: ${foreground};
      background: ${background};
      line-height: 1.6;
    }

    * {
      box-sizing: border-box;
    }

    img, svg, video, canvas {
      max-width: 100%;
      height: auto;
    }

    a {
      color: ${accent};
    }

    pre, code {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
    }

    pre {
      overflow-x: auto;
    }

    blockquote {
      margin-left: 0;
      padding-left: 16px;
      color: ${secondary};
      border-left: 3px solid ${accent};
    }

    .mermaid-diagram,
    .mermaid-error {
      overflow-x: auto;
      margin: 16px 0;
      padding: 16px;
      border: 1px solid ${border};
      border-radius: 8px;
      background: ${inset};
    }

    .mermaid-diagram svg {
      max-width: 100%;
      height: auto;
    }
  `
}

function useStableHtmlPreviewId(): string {
  return `mding-html-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
}

function messageFromError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return "Unable to render Mermaid diagram."
}
