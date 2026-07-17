import { type CSSProperties, lazy, Suspense, useEffect } from "react"
import { type AppLanguage, translate } from "../app/i18n"
import { assertNever } from "../domain/result"
import { DocumentFormat } from "../domain/workspace"
import {
  applyDocumentSearch,
  clearDocumentSearch,
  setActiveDocumentSearchMatch,
} from "./documentSearch"
import { PreviewErrorBoundary } from "./PreviewRecovery"
import { useScrollProgress } from "./useScrollProgress"

const MarkdownPreview = lazy(() =>
  import("./MarkdownPreview").then((module) => ({ default: module.MarkdownPreview })),
)
const HtmlPreview = lazy(() =>
  import("./HtmlPreview").then((module) => ({ default: module.HtmlPreview })),
)

type DocumentPreviewProps = {
  readonly appLanguage: AppLanguage
  readonly documentFormat: DocumentFormat
  readonly documentId: string
  readonly onReadingProgressChange: (documentId: string, ratio: number) => void
  readonly onSearchResultChange: (count: number, activeIndex: number) => void
  readonly onScrollDirectionChange: (direction: "up" | "down") => void
  readonly readingProgressRatio: number
  readonly searchIndex: number
  readonly searchQuery: string
  readonly source: string
  readonly zoom: number
}

type MarkdownZoomStyle = CSSProperties & {
  readonly fontSize: string
}

export function DocumentPreview({
  appLanguage,
  documentFormat,
  documentId,
  onReadingProgressChange,
  onSearchResultChange,
  onScrollDirectionChange,
  readingProgressRatio,
  searchIndex,
  searchQuery,
  source,
  zoom,
}: DocumentPreviewProps) {
  const markdownPreviewRef = useScrollProgress<HTMLElement>({
    documentId,
    enabled: documentFormat === DocumentFormat.Markdown,
    initialRatio: readingProgressRatio,
    onProgressChange: onReadingProgressChange,
  })
  const markdownZoomStyle = createMarkdownZoomStyle(zoom)
  const t = (key: Parameters<typeof translate>[1]) => translate(appLanguage, key)

  useEffect(() => {
    const preview = markdownPreviewRef.current
    if (documentFormat !== DocumentFormat.Markdown || preview === null) {
      return
    }
    const renderedSource = source
    const matches = applyDocumentSearch(preview, searchQuery)
    const activeIndex = matches.length === 0 ? -1 : Math.min(searchIndex, matches.length - 1)
    if (renderedSource.length === 0 && searchQuery.trim().length === 0) {
      onSearchResultChange(0, -1)
      return
    }
    if (activeIndex >= 0) {
      setActiveDocumentSearchMatch(matches, activeIndex)
    }
    onSearchResultChange(matches.length, activeIndex)

    return () => {
      clearDocumentSearch(preview)
    }
  }, [documentFormat, markdownPreviewRef, onSearchResultChange, searchIndex, searchQuery, source])

  switch (documentFormat) {
    case DocumentFormat.Html:
      return (
        <article className="html-preview">
          <PreviewErrorBoundary appLanguage={appLanguage} resetKey={`html:${source}`}>
            <Suspense fallback={<p>{t("loadingPreview")}</p>}>
              <HtmlPreview
                appLanguage={appLanguage}
                documentId={documentId}
                html={source}
                readingProgressRatio={readingProgressRatio}
                searchIndex={searchIndex}
                searchQuery={searchQuery}
                zoom={zoom}
                onReadingProgressChange={onReadingProgressChange}
                onSearchResultChange={onSearchResultChange}
                onScrollDirectionChange={onScrollDirectionChange}
              />
            </Suspense>
          </PreviewErrorBoundary>
          {source.trim().length === 0 ? (
            <div className="empty-state document-empty">{t("emptyHtml")}</div>
          ) : null}
        </article>
      )
    case DocumentFormat.Markdown:
      return (
        <article className="markdown-preview" ref={markdownPreviewRef}>
          <PreviewErrorBoundary appLanguage={appLanguage} resetKey={`markdown:${zoom}:${source}`}>
            <div className="markdown-body" style={markdownZoomStyle}>
              <Suspense fallback={<p>{t("loadingPreview")}</p>}>
                <MarkdownPreview markdown={source} />
              </Suspense>
            </div>
          </PreviewErrorBoundary>
          {source.trim().length === 0 ? (
            <div className="empty-state document-empty">{t("emptyMarkdown")}</div>
          ) : null}
        </article>
      )
    default:
      return assertNever(documentFormat)
  }
}

function createMarkdownZoomStyle(zoom: number): MarkdownZoomStyle {
  return {
    fontSize: `${15 * zoom}px`,
  }
}
