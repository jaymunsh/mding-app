import { AlertCircle } from "lucide-react"
import { type DragEvent, useEffect, useRef, useState } from "react"
import { classifyDroppedFiles, DropImportKind } from "../app/dropImport"
import {
  applyThemePreference,
  readThemePreference,
  saveThemePreference,
  ThemePreference,
} from "../app/theme"
import { useWorkspaceController } from "../app/workspaceController"
import { AppTopbar } from "./AppTopbar"
import { CreateFileDialog } from "./CreateFileDialog"
import { DocumentPane } from "./DocumentPane"
import { FileTree } from "./FileTree"
import { HelpDialog } from "./HelpDialog"

export function App() {
  const workspace = useWorkspaceController()
  const documentInputRef = useRef<HTMLInputElement>(null)
  const workspaceInputRef = useRef<HTMLInputElement>(null)
  const newFileInputRef = useRef<HTMLInputElement>(null)
  const [themePreference, setThemePreference] = useState(readThemePreference)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isCreateFileOpen, setIsCreateFileOpen] = useState(false)
  const [isDropActive, setIsDropActive] = useState(false)
  const [newFileName, setNewFileName] = useState("Untitled.md")

  useEffect(() => {
    applyThemePreference(themePreference)
    saveThemePreference(themePreference)

    if (themePreference !== ThemePreference.System) {
      return
    }

    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
    const updateSystemThemeColor = () => applyThemePreference(themePreference)
    systemTheme.addEventListener("change", updateSystemThemeColor)
    return () => systemTheme.removeEventListener("change", updateSystemThemeColor)
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

  function handleDragEnter(event: DragEvent<HTMLDivElement>): void {
    if (!event.dataTransfer.types.includes("Files")) {
      return
    }
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
    setIsDropActive(true)
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>): void {
    if (!event.dataTransfer.types.includes("Files")) {
      return
    }
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>): void {
    const relatedTarget = event.relatedTarget
    if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) {
      return
    }
    setIsDropActive(false)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault()
    setIsDropActive(false)

    const droppedImport = classifyDroppedFiles(Array.from(event.dataTransfer.files))
    switch (droppedImport.kind) {
      case DropImportKind.Documents:
        void workspace.importDocumentFiles(droppedImport.files)
        return
      case DropImportKind.Workspace:
        void workspace.importWorkspaceFile(droppedImport.file)
        return
      case DropImportKind.None:
        return
    }
  }

  return (
    <div
      className={`app-shell screen-${workspace.screen}`}
      role="application"
      aria-label="mding workspace"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <AppTopbar
        storagePersisted={workspace.storagePersisted}
        themePreference={themePreference}
        onThemePreferenceChange={setThemePreference}
        onCreateFolder={workspace.createFolder}
        onCreateFile={openCreateFileDialog}
        onImportDocument={() => documentInputRef.current?.click()}
        onImportWorkspace={() => workspaceInputRef.current?.click()}
        onExportWorkspace={workspace.exportWorkspace}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

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
      {isDropActive ? (
        <div className="drop-overlay" aria-hidden="true">
          <div className="drop-overlay-surface">Drop files to import</div>
        </div>
      ) : null}

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
