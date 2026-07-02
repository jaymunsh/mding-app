import { ArrowLeft, Check, Download, Eye, Pencil, X } from "lucide-react"
import { lazy, Suspense } from "react"
import type { WorkspaceController } from "../app/workspaceController"
import { NodeKind } from "../domain/workspace"

const MarkdownPreview = lazy(() =>
  import("./MarkdownPreview").then((module) => ({ default: module.MarkdownPreview })),
)

type DocumentPaneProps = {
  readonly workspace: WorkspaceController
}

export function DocumentPane({ workspace }: DocumentPaneProps) {
  if (workspace.selectedNode === null || workspace.selectedNode.kind === NodeKind.Folder) {
    return (
      <section className="document-pane empty-document" aria-label="No document selected">
        <div>
          <h1>Select a Markdown file</h1>
          <p>Create or import files, then open one to preview and edit offline.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="document-pane" aria-label="Markdown document">
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
          {workspace.isEditing ? (
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
                onClick={workspace.exportSelectedMarkdown}
                aria-label="Export md"
              >
                <Download size={16} aria-hidden="true" />
                <span>Export md</span>
              </button>
              <button
                className="primary"
                type="button"
                onClick={workspace.startEditing}
                aria-label="Edit"
              >
                <Pencil size={16} aria-hidden="true" />
                <span>Edit</span>
              </button>
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
        <article className="markdown-preview">
          <div className="markdown-body">
            <Suspense fallback={<p>Loading preview...</p>}>
              <MarkdownPreview markdown={workspace.selectedDocument?.markdown ?? ""} />
            </Suspense>
          </div>
          {workspace.selectedDocument?.markdown.trim().length === 0 ? (
            <div className="empty-state document-empty">
              <Eye size={18} aria-hidden="true" />
              This Markdown file is empty.
            </div>
          ) : null}
        </article>
      )}
    </section>
  )
}
