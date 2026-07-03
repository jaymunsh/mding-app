import {
  AlertCircle,
  CircleHelp,
  Download,
  FileInput,
  FilePlus2,
  FolderPlus,
  Monitor,
  Moon,
  Sun,
  Upload,
  X,
} from "lucide-react"
import { type RefObject, useEffect, useRef, useState } from "react"
import {
  applyThemePreference,
  readThemePreference,
  saveThemePreference,
  ThemePreference,
} from "../app/theme"
import { useWorkspaceController } from "../app/workspaceController"
import { DocumentPane } from "./DocumentPane"
import { FileTree } from "./FileTree"

const APP_VERSION = "v0.6"

export function App() {
  const workspace = useWorkspaceController()
  const documentInputRef = useRef<HTMLInputElement>(null)
  const workspaceInputRef = useRef<HTMLInputElement>(null)
  const newFileInputRef = useRef<HTMLInputElement>(null)
  const [themePreference, setThemePreference] = useState(readThemePreference)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isCreateFileOpen, setIsCreateFileOpen] = useState(false)
  const [newFileName, setNewFileName] = useState("Untitled.md")

  useEffect(() => {
    applyThemePreference(themePreference)
    saveThemePreference(themePreference)
  }, [themePreference])

  useEffect(() => {
    if (isCreateFileOpen) {
      newFileInputRef.current?.focus()
      newFileInputRef.current?.select()
    }
  }, [isCreateFileOpen])

  function openCreateFileDialog(): void {
    setNewFileName("Untitled.md")
    setIsCreateFileOpen(true)
  }

  function submitCreateFile(): void {
    const trimmedName = newFileName.trim()
    if (trimmedName.length === 0) {
      return
    }
    void workspace.createFile(trimmedName).then(() => setIsCreateFileOpen(false))
  }

  return (
    <div className={`app-shell screen-${workspace.screen}`}>
      <header className="topbar">
        <div className="brand">
          <img className="brand-mark" src="/icons/icon.svg" alt="" aria-hidden="true" />
          <div>
            <div className="brand-title-row">
              <strong>mding</strong>
              <span className="app-version">{APP_VERSION}</span>
            </div>
            <span className="brand-subtitle">
              {workspace.storagePersisted ? "persistent local storage" : "local workspace"}
            </span>
          </div>
        </div>
        <div className="toolbar-group">
          <button
            className="toolbar-button"
            type="button"
            onClick={workspace.createFolder}
            aria-label="Folder"
          >
            <FolderPlus size={17} aria-hidden="true" />
            <span>Folder</span>
          </button>
          <button
            className="toolbar-button"
            type="button"
            onClick={openCreateFileDialog}
            aria-label="File"
          >
            <FilePlus2 size={17} aria-hidden="true" />
            <span>File</span>
          </button>
          <button
            className="toolbar-button"
            type="button"
            onClick={() => documentInputRef.current?.click()}
            aria-label="Import file"
          >
            <FileInput size={17} aria-hidden="true" />
            <span>Import file</span>
          </button>
          <button
            className="toolbar-button"
            type="button"
            onClick={() => workspaceInputRef.current?.click()}
            aria-label="Import backup"
          >
            <Upload size={17} aria-hidden="true" />
            <span>Import backup</span>
          </button>
          <button
            className="toolbar-button"
            type="button"
            onClick={workspace.exportWorkspace}
            aria-label="Backup"
          >
            <Download size={17} aria-hidden="true" />
            <span>Backup</span>
          </button>
          <button
            className="toolbar-button"
            type="button"
            onClick={() => setIsHelpOpen(true)}
            aria-label="Quick guide"
          >
            <CircleHelp size={17} aria-hidden="true" />
            <span>Guide</span>
          </button>
        </div>
        <div className="topbar-controls">
          <fieldset className="theme-switcher">
            <legend>Theme</legend>
            <button
              className={themePreference === ThemePreference.System ? "selected" : ""}
              type="button"
              onClick={() => setThemePreference(ThemePreference.System)}
              aria-label="Use system theme"
              title="System"
            >
              <Monitor size={16} aria-hidden="true" />
            </button>
            <button
              className={themePreference === ThemePreference.Light ? "selected" : ""}
              type="button"
              onClick={() => setThemePreference(ThemePreference.Light)}
              aria-label="Use light theme"
              title="Light"
            >
              <Sun size={16} aria-hidden="true" />
            </button>
            <button
              className={themePreference === ThemePreference.Dark ? "selected" : ""}
              type="button"
              onClick={() => setThemePreference(ThemePreference.Dark)}
              aria-label="Use dark theme"
              title="Dark"
            >
              <Moon size={16} aria-hidden="true" />
            </button>
          </fieldset>
        </div>
      </header>

      {workspace.errorMessage !== null ? (
        <div className="app-alert" role="alert">
          <AlertCircle size={17} aria-hidden="true" />
          <span>{workspace.errorMessage}</span>
          <button type="button" onClick={workspace.clearError}>
            Dismiss
          </button>
        </div>
      ) : null}

      <main className="workspace-frame">
        <aside className="sidebar" aria-label="Workspace files">
          <FileTree workspace={workspace} />
        </aside>
        <section className="document-region">
          <DocumentPane workspace={workspace} />
        </section>
      </main>

      <input
        ref={documentInputRef}
        className="hidden-input"
        type="file"
        aria-label="Import Markdown or HTML files"
        multiple
        onChange={(event) => {
          const files = event.currentTarget.files
          if (files !== null) {
            void workspace.importDocumentFiles(Array.from(files))
          }
          event.currentTarget.value = ""
        }}
      />
      <input
        ref={workspaceInputRef}
        className="hidden-input"
        type="file"
        aria-label="Import workspace backup"
        accept="application/zip,application/json,.zip,.json"
        onChange={(event) => {
          const file = event.currentTarget.files?.item(0)
          if (file !== null && file !== undefined) {
            void workspace.importWorkspaceFile(file)
          }
          event.currentTarget.value = ""
        }}
      />
      {isHelpOpen ? <HelpDialog onClose={() => setIsHelpOpen(false)} /> : null}
      {isCreateFileOpen ? (
        <CreateFileDialog
          inputRef={newFileInputRef}
          name={newFileName}
          onNameChange={setNewFileName}
          onCancel={() => setIsCreateFileOpen(false)}
          onCreate={submitCreateFile}
        />
      ) : null}
    </div>
  )
}

type CreateFileDialogProps = {
  readonly inputRef: RefObject<HTMLInputElement | null>
  readonly name: string
  readonly onNameChange: (name: string) => void
  readonly onCancel: () => void
  readonly onCreate: () => void
}

function CreateFileDialog({
  inputRef,
  name,
  onNameChange,
  onCancel,
  onCreate,
}: CreateFileDialogProps) {
  const canCreate = name.trim().length > 0

  return (
    <div className="modal-overlay">
      <button className="modal-backdrop" type="button" onClick={onCancel} aria-label="Cancel" />
      <section
        className="name-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-file-title"
      >
        <header className="name-dialog-header">
          <h2 id="new-file-title">New Markdown file</h2>
          <button type="button" onClick={onCancel} aria-label="Cancel">
            <X size={16} aria-hidden="true" />
          </button>
        </header>
        <form
          className="name-dialog-form"
          onSubmit={(event) => {
            event.preventDefault()
            onCreate()
          }}
        >
          <label htmlFor="new-file-name">File name</label>
          <input
            id="new-file-name"
            ref={inputRef}
            type="text"
            value={name}
            placeholder="Notes.md"
            onChange={(event) => onNameChange(event.currentTarget.value)}
          />
          <p>`.md` is added automatically when omitted.</p>
          <div className="name-dialog-actions">
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
            <button className="primary" type="submit" disabled={!canCreate}>
              Create
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function HelpDialog({ onClose }: { readonly onClose: () => void }) {
  return (
    <div className="modal-overlay help-overlay">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="Close guide" />
      <section className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <header className="help-header">
          <h2 id="help-title">Quick guide</h2>
          <button type="button" onClick={onClose} aria-label="Close guide">
            <X size={16} aria-hidden="true" />
          </button>
        </header>
        <div className="help-content">
          <section className="help-section">
            <h3>Write</h3>
            <ul>
              <li>Create folders and Markdown files from the top toolbar.</li>
              <li>Open a Markdown file to preview it, then use Edit to change the source.</li>
              <li>Manage mode enables rename, move, and delete actions.</li>
            </ul>
          </section>
          <section className="help-section">
            <h3>Preview</h3>
            <ul>
              <li>
                Markdown supports tables, task lists, callouts, code blocks, Mermaid, and images by
                URL.
              </li>
              <li>HTML files are preview-only and keep their own layout inside the viewer.</li>
              <li>Zoom controls change the document scale without changing the saved file.</li>
            </ul>
          </section>
          <section className="help-section">
            <h3>Backup</h3>
            <ul>
              <li>Workspace data is stored in this browser or installed PWA.</li>
              <li>
                Backup exports a zip you can import again on iOS, iPadOS, macOS, or another browser.
              </li>
              <li>
                Back up before clearing site data, reinstalling the app, or switching devices.
              </li>
            </ul>
          </section>
        </div>
        <p className="help-note">
          Images are not stored locally; keep important image files or URLs separately.
        </p>
      </section>
    </div>
  )
}
