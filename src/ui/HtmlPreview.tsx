import { type CSSProperties, useEffect, useId, useRef, useState } from "react"
import { type AppLanguage, translate } from "../app/i18n"
import { createHtmlPreviewBridgeScript } from "./htmlPreviewBridge"
import { type MermaidColorMode, renderMermaidSvg, useMermaidColorMode } from "./MermaidPreview"

type HtmlPreviewProps = {
  readonly appLanguage: AppLanguage
  readonly html: string
  readonly zoom: number
  readonly onAnchorScroll: (top: number) => void
  readonly onScrollDelta: (deltaY: number) => void
}

type HtmlPreviewState = {
  readonly srcDoc: string
}

export function HtmlPreview({
  appLanguage,
  html,
  zoom,
  onAnchorScroll,
  onScrollDelta,
}: HtmlPreviewProps) {
  const idPrefix = useStableHtmlPreviewId()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const colorMode = useMermaidColorMode()
  const [preview, setPreview] = useState<HtmlPreviewState>(() => ({
    srcDoc: createLoadingDocument(colorMode, zoom, appLanguage),
  }))
  const [contentHeight, setContentHeight] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    async function buildPreview(): Promise<void> {
      try {
        const srcDoc = await createHtmlPreviewDocument(html, colorMode, idPrefix, zoom)
        if (!cancelled) {
          setPreview({ srcDoc })
        }
      } catch (error) {
        if (!cancelled) {
          setPreview({
            srcDoc: createHtmlPreviewErrorDocument(colorMode, zoom, appLanguage, error),
          })
        }
      }
    }

    void buildPreview()

    return () => {
      cancelled = true
    }
  }, [appLanguage, colorMode, html, idPrefix, zoom])

  useEffect(() => {
    function handleMessage(event: MessageEvent): void {
      if (event.source !== iframeRef.current?.contentWindow) {
        return
      }
      const top = parseHtmlAnchorScrollMessage(event.data)
      if (top !== null) {
        onAnchorScroll(top)
        return
      }
      const deltaY = parseHtmlScrollDeltaMessage(event.data)
      if (deltaY !== null) {
        onScrollDelta(deltaY)
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [onAnchorScroll, onScrollDelta])

  const iframeStyle = createIframeStyle(contentHeight)

  return (
    <iframe
      className="html-preview-frame"
      ref={iframeRef}
      style={iframeStyle}
      title="HTML preview"
      srcDoc={preview.srcDoc}
      onLoad={() => syncIframeHeight(iframeRef.current, setContentHeight)}
    />
  )
}

export function parseHtmlAnchorScrollMessage(data: unknown): number | null {
  if (typeof data !== "object" || data === null || !("type" in data) || !("top" in data)) {
    return null
  }
  if (data.type !== "mding:html-anchor-scroll" || typeof data.top !== "number") {
    return null
  }
  if (!Number.isFinite(data.top)) {
    return null
  }
  if (data.top <= 0) {
    return 0
  }
  return data.top
}

export function parseHtmlScrollDeltaMessage(data: unknown): number | null {
  if (typeof data !== "object" || data === null || !("type" in data) || !("deltaY" in data)) {
    return null
  }
  if (data.type !== "mding:html-scroll-delta" || typeof data.deltaY !== "number") {
    return null
  }
  return Number.isFinite(data.deltaY) ? data.deltaY : null
}

function createIframeStyle(contentHeight: number | null): CSSProperties {
  return contentHeight === null ? {} : { height: `${contentHeight}px` }
}

function syncIframeHeight(
  iframe: HTMLIFrameElement | null,
  setContentHeight: (height: number) => void,
): void {
  let frame = 0

  function sync(): void {
    const documentElement = iframe?.contentDocument?.documentElement
    if (documentElement === undefined || documentElement === null) {
      return
    }
    setContentHeight(documentElement.scrollHeight)
    frame += 1
    if (frame < 45) {
      window.requestAnimationFrame(sync)
    }
  }

  window.requestAnimationFrame(sync)
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
