import { useEffect, useId, useState } from "react"
import { createHtmlPreviewBridgeScript } from "./htmlPreviewBridge"
import { type MermaidColorMode, renderMermaidSvg, useMermaidColorMode } from "./MarkdownPreview"

type HtmlPreviewProps = {
  readonly html: string
  readonly zoom: number
}

type HtmlPreviewState = {
  readonly srcDoc: string
}

export function HtmlPreview({ html, zoom }: HtmlPreviewProps) {
  const idPrefix = useStableHtmlPreviewId()
  const colorMode = useMermaidColorMode()
  const [preview, setPreview] = useState<HtmlPreviewState>(() => ({
    srcDoc: createLoadingDocument(colorMode, zoom),
  }))

  useEffect(() => {
    let cancelled = false

    async function buildPreview(): Promise<void> {
      const srcDoc = await createHtmlPreviewDocument(html, colorMode, idPrefix, zoom)
      if (!cancelled) {
        setPreview({ srcDoc })
      }
    }

    void buildPreview()

    return () => {
      cancelled = true
    }
  }, [colorMode, html, idPrefix, zoom])

  return <iframe className="html-preview-frame" title="HTML preview" srcDoc={preview.srcDoc} />
}

async function createHtmlPreviewDocument(
  html: string,
  colorMode: MermaidColorMode,
  idPrefix: string,
  zoom: number,
): Promise<string> {
  const document = new DOMParser().parseFromString(html, "text/html")
  injectPreviewStyle(document, colorMode)
  await renderMermaidBlocks(document, colorMode, idPrefix)
  injectPreviewBridge(document, colorMode, zoom)
  return `<!doctype html>${document.documentElement.outerHTML}`
}

function createLoadingDocument(colorMode: MermaidColorMode, zoom: number): string {
  const foreground = colorMode === "dark" ? "#f3f4ed" : "#181916"
  const background = colorMode === "dark" ? "#0c0d0b" : "#ffffff"
  return `<!doctype html><html style="zoom:${zoom}"><body style="margin:0;padding:20px;color:${foreground};background:${background};font-family:system-ui,sans-serif">Loading HTML preview...</body></html>`
}

function injectPreviewStyle(document: Document, colorMode: MermaidColorMode): void {
  const style = document.createElement("style")
  style.textContent = previewStyle(colorMode)
  document.head.append(style)
}

function injectPreviewBridge(document: Document, colorMode: MermaidColorMode, zoom: number): void {
  const script = document.createElement("script")
  script.textContent = createHtmlPreviewBridgeScript(colorMode, zoom)
  document.body.append(script)
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
  const inset = isDark ? "#111210" : "#f7f7f4"
  const border = isDark ? "#31342e" : "#d9dbd2"

  return `
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
