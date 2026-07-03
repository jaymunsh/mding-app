import { ArrowLeft, Check, Download, Eye, Pencil, X } from "lucide-react"
import { lazy, Suspense } from "react"
import type { WorkspaceController } from "../app/workspaceController"
import { assertNever } from "../domain/result"
import { DocumentFormat, isEditableDocument, NodeKind } from "../domain/workspace"

const MarkdownPreview = lazy(() =>
  import("./MarkdownPreview").then((module) => ({ default: module.MarkdownPreview })),
)
const HtmlPreview = lazy(() =>
  import("./HtmlPreview").then((module) => ({ default: module.HtmlPreview })),
)

type DocumentPaneProps = {
  readonly workspace: WorkspaceController
}

export function DocumentPane({ workspace }: DocumentPaneProps) {
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

  return (
    <section className="document-pane" aria-label="Document">
      <header className="document-header">
        <div className="document-title-group">
          <button className="document-back" type="button" onClick={workspace.showBrowser}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Files</span>
          </button>
          <div>
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
        />
      )}
    </section>
  )
}

function DocumentPreview({
  documentFormat,
  source,
}: {
  readonly documentFormat: DocumentFormat
  readonly source: string
}) {
  switch (documentFormat) {
    case DocumentFormat.Html:
      return (
        <article className="html-preview">
          <Suspense fallback={<p>Loading preview...</p>}>
            <HtmlPreview html={source} />
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
          <div className="markdown-body">
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
