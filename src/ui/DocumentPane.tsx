import { ArrowLeft, Check, Download, Eye, Pencil, X, ZoomIn, ZoomOut } from "lucide-react"
import {
  type CSSProperties,
  lazy,
  type PointerEvent as ReactPointerEvent,
  Suspense,
  useRef,
  useState,
} from "react"
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
const MOBILE_DETAIL_MAX_WIDTH = 759
const BACK_SWIPE_EDGE_WIDTH = 24
const BACK_SWIPE_MIN_DISTANCE = 70
const BACK_SWIPE_MAX_VERTICAL_DRIFT = 56
const BACK_SWIPE_HORIZONTAL_DOMINANCE = 1.35

type DocumentPaneProps = {
  readonly workspace: WorkspaceController
}

type MarkdownZoomStyle = CSSProperties & {
  readonly fontSize: string
}

type BackSwipeGesture = {
  readonly currentX: number
  readonly currentY: number
  readonly isEditing: boolean
  readonly startX: number
  readonly startY: number
  readonly viewportWidth: number
}

type ActiveBackSwipe = {
  readonly pointerId: number
  readonly startX: number
  readonly startY: number
}

export function DocumentPane({ workspace }: DocumentPaneProps) {
  const [previewZoomIndex, setPreviewZoomIndex] = useState(DEFAULT_PREVIEW_ZOOM_INDEX)
  const activeBackSwipeRef = useRef<ActiveBackSwipe | null>(null)

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

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>): void {
    if (event.pointerType !== "touch" || workspace.isEditing) {
      activeBackSwipeRef.current = null
      return
    }

    if (event.clientX > BACK_SWIPE_EDGE_WIDTH || window.innerWidth > MOBILE_DETAIL_MAX_WIDTH) {
      activeBackSwipeRef.current = null
      return
    }

    activeBackSwipeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLElement>): void {
    const activeBackSwipe = activeBackSwipeRef.current
    activeBackSwipeRef.current = null
    if (activeBackSwipe === null || activeBackSwipe.pointerId !== event.pointerId) {
      return
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (
      shouldNavigateBackFromEdgeSwipe({
        currentX: event.clientX,
        currentY: event.clientY,
        isEditing: workspace.isEditing,
        startX: activeBackSwipe.startX,
        startY: activeBackSwipe.startY,
        viewportWidth: window.innerWidth,
      })
    ) {
      workspace.showBrowser()
    }
  }

  return (
    <section className="document-pane" aria-label="Document">
      {!workspace.isEditing ? (
        <div
          className="document-edge-swipe-zone"
          aria-hidden="true"
          onPointerCancel={() => {
            activeBackSwipeRef.current = null
          }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        />
      ) : null}
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

export function shouldNavigateBackFromEdgeSwipe(gesture: BackSwipeGesture): boolean {
  if (gesture.isEditing || gesture.viewportWidth > MOBILE_DETAIL_MAX_WIDTH) {
    return false
  }
  if (gesture.startX > BACK_SWIPE_EDGE_WIDTH) {
    return false
  }

  const deltaX = gesture.currentX - gesture.startX
  const deltaY = Math.abs(gesture.currentY - gesture.startY)

  return (
    deltaX >= BACK_SWIPE_MIN_DISTANCE &&
    deltaY <= BACK_SWIPE_MAX_VERTICAL_DRIFT &&
    deltaX >= deltaY * BACK_SWIPE_HORIZONTAL_DOMINANCE
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
