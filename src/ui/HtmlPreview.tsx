import { useEffect, useId, useRef, useState } from "react"
import { type AppLanguage, translate } from "../app/i18n"
import { createHtmlPreviewBridgeScript } from "./htmlPreviewBridge"
import { type MermaidColorMode, renderMermaidSvg, useMermaidColorMode } from "./MermaidPreview"

type HtmlPreviewProps = {
  readonly appLanguage: AppLanguage
  readonly documentId: string
  readonly html: string
  readonly readingProgressRatio: number
  readonly searchIndex: number
  readonly searchQuery: string
  readonly zoom: number
  readonly onReadingProgressChange: (documentId: string, ratio: number) => void
  readonly onSearchResultChange: (count: number, activeIndex: number) => void
}

type HtmlPreviewState = {
  readonly srcDoc: string
}

export function HtmlPreview({
  appLanguage,
  documentId,
  html,
  readingProgressRatio,
  searchIndex,
  searchQuery,
  zoom,
  onReadingProgressChange,
  onSearchResultChange,
}: HtmlPreviewProps) {
  const idPrefix = useStableHtmlPreviewId()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const latestReadingProgressRef = useRef(readingProgressRatio)
  const latestZoomRef = useRef(zoom)
  const colorMode = useMermaidColorMode()
  const [preview, setPreview] = useState<HtmlPreviewState>(() => ({
    srcDoc: createLoadingDocument(colorMode, zoom, appLanguage),
  }))

  useEffect(() => {
    latestReadingProgressRef.current = readingProgressRatio
  }, [readingProgressRatio])

  useEffect(() => {
    latestZoomRef.current = zoom
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: "mding:html-preview-zoom",
        zoom,
      },
      "*",
    )
  }, [zoom])

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        activeIndex: searchIndex,
        query: searchQuery,
        type: "mding:html-preview-search",
      },
      "*",
    )
  }, [searchIndex, searchQuery])

  useEffect(() => {
    let cancelled = false

    async function buildPreview(): Promise<void> {
      try {
        const srcDoc = await createHtmlPreviewDocument(
          html,
          colorMode,
          idPrefix,
          latestZoomRef.current,
          latestReadingProgressRef.current,
        )
        if (!cancelled) {
          setPreview({ srcDoc })
        }
      } catch (error) {
        if (!cancelled) {
          setPreview({
            srcDoc: createHtmlPreviewErrorDocument(
              colorMode,
              latestZoomRef.current,
              appLanguage,
              error,
            ),
          })
        }
      }
    }

    void buildPreview()

    return () => {
      cancelled = true
    }
  }, [appLanguage, colorMode, html, idPrefix])

  useEffect(() => {
    function handleMessage(event: MessageEvent): void {
      if (event.source !== iframeRef.current?.contentWindow) {
        return
      }
      const ratio = parseHtmlReadingProgressMessage(event.data)
      if (ratio !== null) {
        onReadingProgressChange(documentId, ratio)
        return
      }
      const searchResult = parseHtmlSearchResultMessage(event.data)
      if (searchResult !== null) {
        onSearchResultChange(searchResult.count, searchResult.activeIndex)
      }
    }

    window.addEventListener("message", handleMessage)
    return () => {
      window.removeEventListener("message", handleMessage)
      const finalRatio = readIframeReadingProgress(iframeRef.current)
      if (finalRatio !== null) {
        onReadingProgressChange(documentId, finalRatio)
      }
    }
  }, [documentId, onReadingProgressChange, onSearchResultChange])

  return (
    <iframe
      className="html-preview-frame"
      ref={iframeRef}
      scrolling="yes"
      title="HTML preview"
      srcDoc={preview.srcDoc}
    />
  )
}

export function parseHtmlReadingProgressMessage(data: unknown): number | null {
  if (typeof data !== "object" || data === null || !("type" in data) || !("ratio" in data)) {
    return null
  }
  if (data.type !== "mding:html-reading-progress" || typeof data.ratio !== "number") {
    return null
  }
  return clampRatio(data.ratio)
}

type HtmlSearchResult = {
  readonly activeIndex: number
  readonly count: number
}

function parseHtmlSearchResultMessage(data: unknown): HtmlSearchResult | null {
  if (
    typeof data !== "object" ||
    data === null ||
    !("type" in data) ||
    !("count" in data) ||
    !("activeIndex" in data)
  ) {
    return null
  }
  if (
    data.type !== "mding:html-preview-search-result" ||
    typeof data.count !== "number" ||
    typeof data.activeIndex !== "number"
  ) {
    return null
  }
  return {
    activeIndex: data.activeIndex,
    count: data.count,
  }
}

function readIframeReadingProgress(iframe: HTMLIFrameElement | null): number | null {
  const frameWindow = iframe?.contentWindow
  const documentElement = iframe?.contentDocument?.documentElement
  if (frameWindow === undefined || frameWindow === null || documentElement === undefined) {
    return null
  }
  const maxScrollTop = documentElement.scrollHeight - frameWindow.innerHeight
  if (maxScrollTop <= 0) {
    return 0
  }
  return clampRatio(frameWindow.scrollY / maxScrollTop)
}

async function createHtmlPreviewDocument(
  html: string,
  colorMode: MermaidColorMode,
  idPrefix: string,
  zoom: number,
  readingProgressRatio: number,
): Promise<string> {
  const document = new DOMParser().parseFromString(html, "text/html")
  injectPreviewStyle(document, colorMode)
  await renderMermaidBlocks(document, colorMode, idPrefix)
  injectPreviewBridge(document, colorMode, zoom, readingProgressRatio)
  return `<!doctype html>${document.documentElement.outerHTML}`
}

function createLoadingDocument(
  colorMode: MermaidColorMode,
  zoom: number,
  appLanguage: AppLanguage,
): string {
  const foreground = colorMode === "dark" ? "#f3f4ed" : "#181916"
  const background = colorMode === "dark" ? "#0c0d0b" : "#ffffff"
  return `<!doctype html><html style="zoom:${zoom}"><body style="margin:0;padding:20px;color:${foreground};background:${background};font-family:system-ui,sans-serif">${translate(appLanguage, "loadingHtmlPreview")}</body></html>`
}

export function createHtmlPreviewErrorDocument(
  colorMode: MermaidColorMode,
  zoom: number,
  appLanguage: AppLanguage,
  error: unknown,
): string {
  const foreground = colorMode === "dark" ? "#f3f4ed" : "#181916"
  const secondary = colorMode === "dark" ? "#a9ada1" : "#65685f"
  const background = colorMode === "dark" ? "#0c0d0b" : "#ffffff"
  const inset = colorMode === "dark" ? "#111210" : "#f7f7f4"
  const border = colorMode === "dark" ? "#31342e" : "#d9dbd2"
  const message = escapeHtml(messageFromError(error))
  const title =
    appLanguage === "ko" ? "HTML 미리보기를 불러올 수 없습니다" : "HTML preview could not load"
  const detail =
    appLanguage === "ko"
      ? "이 문서는 로컬에 저장되어 있습니다. 파일 목록으로 돌아가거나 앱을 새로고침해 다시 시도하세요."
      : "This document is still saved locally. Go back to files or reload the app to try again."

  return `<!doctype html><html style="zoom:${zoom}"><body style="margin:0;padding:20px;color:${foreground};background:${background};font-family:system-ui,sans-serif"><main style="box-sizing:border-box;max-width:720px;margin:0 auto;padding:20px;border:1px solid ${border};border-radius:8px;background:${inset}"><h1 style="margin:0 0 8px;font-size:20px;line-height:1.25">${title}</h1><p style="margin:0 0 12px;color:${secondary};line-height:1.5">${detail}</p><pre style="overflow:auto;margin:0;padding:12px;border:1px solid ${border};border-radius:6px;white-space:pre-wrap;font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace">${message}</pre></main></body></html>`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function injectPreviewStyle(document: Document, colorMode: MermaidColorMode): void {
  const style = document.createElement("style")
  style.textContent = previewStyle(colorMode)
  document.head.append(style)
}

function injectPreviewBridge(
  document: Document,
  colorMode: MermaidColorMode,
  zoom: number,
  readingProgressRatio: number,
): void {
  const script = document.createElement("script")
  script.textContent = createHtmlPreviewBridgeScript(colorMode, zoom, readingProgressRatio)
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

    .document-search-match {
      color: inherit;
      background: ${isDark ? "rgba(231, 165, 72, 0.34)" : "rgba(163, 91, 0, 0.24)"};
      border-radius: 4px;
    }

    .document-search-match.active {
      color: ${isDark ? "#111210" : "#ffffff"};
      background: ${isDark ? "#60b49d" : "#2f6f5e"};
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

function clampRatio(ratio: number): number | null {
  if (!Number.isFinite(ratio)) {
    return null
  }
  if (ratio <= 0) {
    return 0
  }
  if (ratio >= 1) {
    return 1
  }
  return ratio
}
