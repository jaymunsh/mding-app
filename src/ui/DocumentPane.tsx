import { ArrowLeft, Check, Download, Eye, Pencil, X, ZoomIn, ZoomOut } from "lucide-react"
import { type CSSProperties, lazy, Suspense, useState } from "react"
import type { WorkspaceController } from "../app/workspaceController"
import { assertNever } from "../domain/result"
import { DocumentFormat, isEditableDocument, NodeKind } from "../domain/workspace"

const MarkdownPreview = lazy(() =>
  import("./MarkdownPreview").then((module) => ({ default: module.MarkdownPreview })),
)
const HtmlPreview = lazy(() =>
  import("./HtmlPreview").then((module) => ({ default: module.HtmlPreview })),
)

const PREVIEW_ZOOM_STEPS = [0.75, 0.9, 1, 1.1, 1.25, 1.5] as const
const DEFAULT_PREVIEW_ZOOM_INDEX = 2

type DocumentPaneProps = {
  readonly workspace: WorkspaceController
}

type MarkdownZoomStyle = CSSProperties & {
  readonly fontSize: string
}

export function DocumentPane({ workspace }: DocumentPaneProps) {
  const [previewZoomIndex, setPreviewZoomIndex] = useState(DEFAULT_PREVIEW_ZOOM_INDEX)

  if (workspace.selectedNode === null || workspace.selectedNode.kind === NodeKind.Folder) {
    return (
      <section className="document-pane empty-document" aria-label="No document selected">
        <div>
          <h1>Select a file</h1>
          <p>Create Markdown files or import Markdown and HTML files to preview offline.</p>
        </div>
      </section>
    )
  }

  const selectedDocument = workspace.selectedDocument
  const documentFormat = selectedDocument?.format ?? DocumentFormat.Markdown
  const canEdit = isEditableDocument(selectedDocument)
  const exportLabel = documentFormat === DocumentFormat.Html ? "Export html" : "Export md"
  const previewZoom = PREVIEW_ZOOM_STEPS[previewZoomIndex] ?? 1

  return (
    <section className="document-pane" aria-label="Document">
      <header className="document-header">
        <div className="document-title-group">
          <button className="document-back" type="button" onClick={workspace.showBrowser}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Files</span>
          </button>
          <div className="document-title-copy">
            <h1>{workspace.selectedNode.name}</h1>
            <p>{workspace.isDirty ? "Unsaved changes" : "Saved locally"}</p>
          </div>
        </div>
        <div className="document-actions">
          {workspace.isEditing && canEdit ? (
            <>
              <button type="button" onClick={workspace.cancelEditing} aria-label="Cancel">
                <X size={16} aria-hidden="true" />
                <span>Cancel</span>
              </button>
              <button
                className="primary"
                type="button"
                onClick={workspace.saveSelectedDocument}
                aria-label="Save"
              >
                <Check size={16} aria-hidden="true" />
                <span>Save</span>
              </button>
            </>
          ) : (
            <>
              <PreviewZoomControls
                zoom={previewZoom}
                canZoomOut={previewZoomIndex > 0}
                canZoomIn={previewZoomIndex < PREVIEW_ZOOM_STEPS.length - 1}
                onZoomOut={() => setPreviewZoomIndex((current) => Math.max(0, current - 1))}
                onZoomIn={() =>
                  setPreviewZoomIndex((current) =>
                    Math.min(PREVIEW_ZOOM_STEPS.length - 1, current + 1),
                  )
                }
                onReset={() => setPreviewZoomIndex(DEFAULT_PREVIEW_ZOOM_INDEX)}
              />
              <button
                type="button"
                onClick={workspace.exportSelectedDocument}
                aria-label={exportLabel}
              >
                <Download size={16} aria-hidden="true" />
                <span>{exportLabel}</span>
              </button>
              {canEdit ? (
                <button
                  className="primary"
                  type="button"
                  onClick={workspace.startEditing}
                  aria-label="Edit"
                >
                  <Pencil size={16} aria-hidden="true" />
                  <span>Edit</span>
                </button>
              ) : null}
            </>
          )}
        </div>
      </header>

      {workspace.isEditing ? (
        <label className="editor-wrap">
          <span>Markdown source</span>
          <textarea
            value={workspace.editBuffer}
            onChange={(event) => workspace.updateEditBuffer(event.currentTarget.value)}
            spellCheck="false"
          />
        </label>
      ) : (
        <DocumentPreview
          documentFormat={documentFormat}
          source={selectedDocument?.markdown ?? ""}
          zoom={previewZoom}
        />
      )}
    </section>
  )
}

function PreviewZoomControls({
  zoom,
  canZoomOut,
  canZoomIn,
  onZoomOut,
  onZoomIn,
  onReset,
}: {
  readonly zoom: number
  readonly canZoomOut: boolean
  readonly canZoomIn: boolean
  readonly onZoomOut: () => void
  readonly onZoomIn: () => void
  readonly onReset: () => void
}) {
  const zoomLabel = `${Math.round(zoom * 100)}%`

  return (
    <fieldset className="preview-zoom-controls">
      <legend>Preview zoom</legend>
      <button type="button" onClick={onZoomOut} disabled={!canZoomOut} aria-label="Zoom out">
        <ZoomOut size={15} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onReset}
        aria-label={`Reset zoom to 100%, current ${zoomLabel}`}
      >
        {zoomLabel}
      </button>
      <button type="button" onClick={onZoomIn} disabled={!canZoomIn} aria-label="Zoom in">
        <ZoomIn size={15} aria-hidden="true" />
      </button>
    </fieldset>
  )
}

function DocumentPreview({
  documentFormat,
  source,
  zoom,
}: {
  readonly documentFormat: DocumentFormat
  readonly source: string
  readonly zoom: number
}) {
  const markdownZoomStyle = createMarkdownZoomStyle(zoom)

  switch (documentFormat) {
    case DocumentFormat.Html:
      return (
        <article className="html-preview">
          <Suspense fallback={<p>Loading preview...</p>}>
            <HtmlPreview html={source} zoom={zoom} />
          </Suspense>
          {source.trim().length === 0 ? (
            <div className="empty-state document-empty">
              <Eye size={18} aria-hidden="true" />
              This HTML file is empty.
            </div>
          ) : null}
        </article>
      )
    case DocumentFormat.Markdown:
      return (
        <article className="markdown-preview">
          <div className="markdown-body" style={markdownZoomStyle}>
            <Suspense fallback={<p>Loading preview...</p>}>
              <MarkdownPreview markdown={source} />
            </Suspense>
          </div>
          {source.trim().length === 0 ? (
            <div className="empty-state document-empty">
              <Eye size={18} aria-hidden="true" />
              This Markdown file is empty.
            </div>
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
