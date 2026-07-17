import { AlertCircle } from "lucide-react"
import { type CSSProperties, type DragEvent, useEffect, useRef, useState } from "react"
import { APP_VERSION } from "../app/appVersion"
import { classifyDroppedFiles, DropImportKind } from "../app/dropImport"
import {
  readLanguagePreference,
  resolveAppLanguage,
  saveLanguagePreference,
  translate,
  translateAppMessage,
} from "../app/i18n"
import {
  applyThemePreference,
  readThemePreference,
  saveThemePreference,
  ThemePreference,
} from "../app/theme"
import { isUpdateHistoryUnseen, markUpdateHistorySeen } from "../app/updateHistory"
import { useWorkspaceController } from "../app/workspaceController"
import { AppTopbar } from "./AppTopbar"
import {
  CreateDialogKind,
  type CreateDialogKind as CreateDialogKindType,
  CreateFileDialog,
  isCreateDialogNameValid,
} from "./CreateFileDialog"
import { DocumentPane } from "./DocumentPane"
import { FileTree } from "./FileTree"
import { HelpDialog } from "./HelpDialog"
import { UndoToast } from "./UndoToast"
import { UpdateHistoryDialog } from "./UpdateHistoryDialog"
import { useSidebarLayout } from "./useSidebarLayout"

type WorkspaceFrameStyle = CSSProperties & {
  readonly "--sidebar-width": string
}

export function App() {
  const workspace = useWorkspaceController()
  const documentInputRef = useRef<HTMLInputElement>(null)
  const workspaceInputRef = useRef<HTMLInputElement>(null)
  const newFileInputRef = useRef<HTMLInputElement>(null)
  const [themePreference, setThemePreference] = useState(readThemePreference)
  const [languagePreference, setLanguagePreference] = useState(readLanguagePreference)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isUpdateHistoryOpen, setIsUpdateHistoryOpen] = useState(false)
  const [hasUnseenUpdate, setHasUnseenUpdate] = useState(() => isUpdateHistoryUnseen(APP_VERSION))
  const [isCreateFileOpen, setIsCreateFileOpen] = useState(false)
  const [createDialogKind, setCreateDialogKind] = useState<CreateDialogKindType>(
    CreateDialogKind.File,
  )
  const [isDropActive, setIsDropActive] = useState(false)
  const [isPreviewFocus, setIsPreviewFocus] = useState(false)
  const [newFileName, setNewFileName] = useState("Untitled.md")
  const sidebar = useSidebarLayout()
  const appLanguage = resolveAppLanguage(languagePreference)
  const t = (key: Parameters<typeof translate>[1]) => translate(appLanguage, key)
  const workspaceFrameStyle: WorkspaceFrameStyle = {
    "--sidebar-width": `${sidebar.width}px`,
  }

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

  useEffect(() => {
    saveLanguagePreference(languagePreference)
  }, [languagePreference])

  function openCreateDialog(kind: CreateDialogKindType): void {
    setCreateDialogKind(kind)
    setNewFileName(kind === CreateDialogKind.File ? "Untitled.md" : "")
    setIsCreateFileOpen(true)
  }

  function openUpdateHistory(): void {
    markUpdateHistorySeen(APP_VERSION)
    setHasUnseenUpdate(false)
    setIsUpdateHistoryOpen(true)
  }

  function submitCreate(): void {
    const trimmedName = newFileName.trim()
    if (!isCreateDialogNameValid(createDialogKind, trimmedName)) {
      return
    }

    if (createDialogKind === CreateDialogKind.File) {
      void workspace.createFile(trimmedName).then((outcome) => {
        if (outcome.kind === "success") {
          setIsCreateFileOpen(false)
        }
      })
      return
    }

    void workspace.createFolder(trimmedName).then((outcome) => {
      if (outcome.kind === "success") {
        workspace.showBrowser()
        setIsCreateFileOpen(false)
      }
    })
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
      className={`app-shell screen-${workspace.screen}${isPreviewFocus ? " preview-focus" : ""}`}
      role="application"
      aria-label={t("appAriaLabel")}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <AppTopbar
        appLanguage={appLanguage}
        lastBackupAt={workspace.lastBackupAt}
        languagePreference={languagePreference}
        storagePersisted={workspace.storagePersisted}
        themePreference={themePreference}
        isUpdateHistoryOpen={isUpdateHistoryOpen}
        isUpdateHistoryUnseen={hasUnseenUpdate}
        onLanguagePreferenceChange={setLanguagePreference}
        onThemePreferenceChange={setThemePreference}
        onCreateFolder={() => openCreateDialog(CreateDialogKind.Folder)}
        onCreateFile={() => openCreateDialog(CreateDialogKind.File)}
        onImportDocument={() => documentInputRef.current?.click()}
        onImportWorkspace={() => workspaceInputRef.current?.click()}
        onExportWorkspace={workspace.exportWorkspace}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenUpdateHistory={openUpdateHistory}
        canClearWorkspace={workspace.nodes.length > 0}
        onClearWorkspace={() => {
          const rootNodeIds = workspace.nodes
            .filter((node) => node.parentId === null)
            .map((node) => node.id)
          void workspace.deleteNodes(rootNodeIds)
        }}
      />

      {workspace.errorMessage !== null ? (
        <div className="app-alert" role="alert">
          <AlertCircle size={17} aria-hidden="true" />
          <span>{translateAppMessage(appLanguage, workspace.errorMessage)}</span>
          <button type="button" onClick={workspace.clearError}>
            {t("dismiss")}
          </button>
        </div>
      ) : null}

      <main
        className={sidebar.isCollapsed ? "workspace-frame sidebar-collapsed" : "workspace-frame"}
        style={workspaceFrameStyle}
      >
        <aside className="sidebar" aria-label={t("workspaceFiles")}>
          <FileTree
            workspace={workspace}
            appLanguage={appLanguage}
            onCollapseSidebar={sidebar.collapse}
          />
        </aside>
        <hr
          className="sidebar-resize-handle"
          aria-label={t("resizeSidebar")}
          aria-orientation="vertical"
          aria-valuemin={232}
          aria-valuemax={340}
          aria-valuenow={sidebar.width}
          tabIndex={0}
          onPointerDown={sidebar.beginResize}
          onKeyDown={sidebar.resizeWithKeyboard}
        />
        <section className="document-region">
          <DocumentPane
            key={workspace.selectedNode?.id ?? "empty-document"}
            workspace={workspace}
            appLanguage={appLanguage}
            isSidebarCollapsed={sidebar.isCollapsed}
            onExpandSidebar={sidebar.expand}
            onPreviewFocusChange={setIsPreviewFocus}
          />
        </section>
      </main>
      {isDropActive ? (
        <div className="drop-overlay" aria-hidden="true">
          <div className="drop-overlay-surface">{t("dropFilesToImport")}</div>
        </div>
      ) : null}
      {workspace.pendingDeletionCount > 0 ? (
        <UndoToast
          appLanguage={appLanguage}
          count={workspace.pendingDeletionCount}
          onDismiss={workspace.dismissPendingDeletion}
          onUndo={workspace.undoPendingDeletion}
        />
      ) : null}

      <input
        ref={documentInputRef}
        className="hidden-input"
        type="file"
        aria-label={t("importDocumentAria")}
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
        aria-label={t("importWorkspaceAria")}
        accept="application/zip,application/json,.zip,.json"
        onChange={(event) => {
          const file = event.currentTarget.files?.item(0)
          if (file !== null && file !== undefined) {
            void workspace.importWorkspaceFile(file)
          }
          event.currentTarget.value = ""
        }}
      />
      {isHelpOpen ? (
        <HelpDialog appLanguage={appLanguage} onClose={() => setIsHelpOpen(false)} />
      ) : null}
      {isUpdateHistoryOpen ? (
        <UpdateHistoryDialog
          appLanguage={appLanguage}
          onClose={() => setIsUpdateHistoryOpen(false)}
        />
      ) : null}
      {isCreateFileOpen ? (
        <CreateFileDialog
          appLanguage={appLanguage}
          inputRef={newFileInputRef}
          kind={createDialogKind}
          name={newFileName}
          onNameChange={setNewFileName}
          onCancel={() => setIsCreateFileOpen(false)}
          onCreate={submitCreate}
        />
      ) : null}
    </div>
  )
}
