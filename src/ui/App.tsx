import {
  AlertCircle,
  Download,
  FileInput,
  FilePlus2,
  FolderPlus,
  Monitor,
  Moon,
  Sun,
  Upload,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import {
  applyThemePreference,
  readThemePreference,
  saveThemePreference,
  ThemePreference,
} from "../app/theme"
import { useWorkspaceController } from "../app/workspaceController"
import { DocumentPane } from "./DocumentPane"
import { FileTree } from "./FileTree"

export function App() {
  const workspace = useWorkspaceController()
  const documentInputRef = useRef<HTMLInputElement>(null)
  const workspaceInputRef = useRef<HTMLInputElement>(null)
  const [themePreference, setThemePreference] = useState(readThemePreference)

  useEffect(() => {
    applyThemePreference(themePreference)
    saveThemePreference(themePreference)
  }, [themePreference])

  return (
    <div className={`app-shell screen-${workspace.screen}`}>
      <header className="topbar">
        <div className="brand">
          <img className="brand-mark" src="/icons/icon.svg" alt="" aria-hidden="true" />
          <div>
            <strong>mding</strong>
            <span>
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
            onClick={workspace.createFile}
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
            className="toolbar-button primary"
            type="button"
            onClick={workspace.exportWorkspace}
            aria-label="Backup"
          >
            <Download size={17} aria-hidden="true" />
            <span>Backup</span>
          </button>
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
        accept=".md,.markdown,.html,.htm,text/markdown,text/html,text/plain"
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
    </div>
  )
}
