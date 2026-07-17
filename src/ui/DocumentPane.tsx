import { ArrowLeft, Check, Minimize2, PanelLeftOpen, Search, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { type AppLanguage, translate } from "../app/i18n"
import type { WorkspaceController } from "../app/workspaceController"
import { DocumentFormat, isEditableDocument, NodeKind } from "../domain/workspace"
import { DocumentPreview } from "./DocumentPreview"
import { DocumentSearchBar } from "./DocumentSearchBar"
import { DocumentTools } from "./DocumentTools"
import { createDocumentSearchResetSignal } from "./documentSearchState"
import { useDocumentPaneNavigation } from "./useDocumentPaneNavigation"

const PREVIEW_ZOOM_STEPS = [0.75, 0.9, 1, 1.1, 1.25, 1.5] as const
const DEFAULT_PREVIEW_ZOOM_INDEX = 2

type DocumentPaneProps = {
  readonly appLanguage: AppLanguage
  readonly workspace: WorkspaceController
  readonly isSidebarCollapsed: boolean
  readonly onExpandSidebar: () => void
  readonly onPreviewFocusChange: (isFocused: boolean) => void
}

export function DocumentPane({
  appLanguage,
  workspace,
  isSidebarCollapsed,
  onExpandSidebar,
  onPreviewFocusChange,
}: DocumentPaneProps) {
  const [previewZoomIndex, setPreviewZoomIndex] = useState(DEFAULT_PREVIEW_ZOOM_INDEX)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchIndex, setSearchIndex] = useState(0)
  const [searchCount, setSearchCount] = useState(0)
  const t = (key: Parameters<typeof translate>[1]) => translate(appLanguage, key)
  const handleReadingProgressChange = useCallback(
    (documentId: string, ratio: number) => {
      workspace.setDocumentReadingProgress(documentId, ratio)
    },
    [workspace],
  )
  const handleSearchResultChange = useCallback((count: number, activeIndex: number) => {
    setSearchCount(count)
    setSearchIndex(count === 0 ? 0 : Math.max(0, Math.min(activeIndex, count - 1)))
  }, [])
  const selectedNodeId = workspace.selectedNode?.id ?? null
  const navigation = useDocumentPaneNavigation({
    documentFormat: workspace.selectedDocument?.format ?? DocumentFormat.Markdown,
    isEditing: workspace.isEditing,
    selectedNodeId,
    onBack: workspace.showBrowser,
  })
  const searchResetSignal = createDocumentSearchResetSignal({
    isEditing: workspace.isEditing,
    screen: workspace.screen,
    selectedNodeId,
  })

  const resetSearch = useCallback(() => {
    setIsSearchOpen(false)
    setSearchQuery("")
    setSearchIndex(0)
    setSearchCount(0)
  }, [])

  useEffect(() => {
    if (searchResetSignal.length === 0) {
      return
    }
    resetSearch()
  }, [resetSearch, searchResetSignal])

  useEffect(() => {
    onPreviewFocusChange(navigation.isPreviewFocus)
    return () => onPreviewFocusChange(false)
  }, [navigation.isPreviewFocus, onPreviewFocusChange])

  if (workspace.selectedNode === null || workspace.selectedNode.kind === NodeKind.Folder) {
    return (
      <section className="document-pane empty-document" aria-label={t("noDocumentAria")}>
        {isSidebarCollapsed ? (
          <button
            className="sidebar-expand-button"
            type="button"
            onClick={onExpandSidebar}
            aria-label={t("expandSidebar")}
          >
            <PanelLeftOpen size={16} aria-hidden="true" />
          </button>
        ) : null}
        <div>
          <h1>{t("selectFile")}</h1>
          <p>{t("selectFileHelp")}</p>
        </div>
      </section>
    )
  }

  const selectedDocument = workspace.selectedDocument
  const documentFormat = selectedDocument?.format ?? DocumentFormat.Markdown
  const canEdit = isEditableDocument(selectedDocument)
  const exportLabel = documentFormat === DocumentFormat.Html ? t("exportHtml") : t("exportMd")
  const previewZoom = PREVIEW_ZOOM_STEPS[previewZoomIndex] ?? 1
  const selectedDocumentId = workspace.selectedNode.id
  const readingProgressRatio = workspace.readingProgress[selectedDocumentId] ?? 0

  function handleSearchQueryChange(query: string): void {
    setSearchQuery(query)
    setSearchIndex(0)
    setSearchCount(0)
  }

  function goToPreviousSearchMatch(): void {
    if (searchCount === 0) {
      return
    }
    setSearchIndex((current) => (current + searchCount - 1) % searchCount)
  }

  function goToNextSearchMatch(): void {
    if (searchCount === 0) {
      return
    }
    setSearchIndex((current) => (current + 1) % searchCount)
  }

  return (
    <section
      className={navigation.isHeaderCondensed ? "document-pane header-condensed" : "document-pane"}
      aria-label={t("document")}
      onScrollCapture={navigation.handleScrollCapture}
    >
      {!workspace.isEditing ? (
        <div
          className="document-edge-swipe-zone"
          aria-hidden="true"
          onPointerCancel={navigation.cancelBackSwipe}
          onPointerDown={navigation.handlePointerDown}
          onPointerUp={navigation.handlePointerUp}
        />
      ) : null}
      <header className="document-header">
        <div className="document-title-group">
          {isSidebarCollapsed ? (
            <button
              className="sidebar-expand-button"
              type="button"
              onClick={onExpandSidebar}
              aria-label={t("expandSidebar")}
            >
              <PanelLeftOpen size={16} aria-hidden="true" />
            </button>
          ) : null}
          <button className="document-back" type="button" onClick={workspace.showBrowser}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span>{t("back")}</span>
          </button>
          <div className="document-title-copy">
            <h1>{workspace.selectedNode.name}</h1>
            <p>{workspace.isDirty ? t("unsavedChanges") : t("savedLocally")}</p>
          </div>
        </div>
        <div className="document-actions">
          {workspace.isEditing && canEdit ? (
            <>
              <button type="button" onClick={workspace.cancelEditing} aria-label={t("cancel")}>
                <X size={16} aria-hidden="true" />
                <span>{t("cancel")}</span>
              </button>
              <button
                className="primary"
                type="button"
                onClick={workspace.saveSelectedDocument}
                aria-label={t("save")}
              >
                <Check size={16} aria-hidden="true" />
                <span>{t("save")}</span>
              </button>
            </>
          ) : (
            <>
              <button
                className={isSearchOpen ? "document-icon-button selected" : "document-icon-button"}
                type="button"
                onClick={() => setIsSearchOpen((current) => !current)}
                aria-label={t("searchDocument")}
                aria-expanded={isSearchOpen}
              >
                <Search size={17} aria-hidden="true" />
              </button>
              <DocumentTools
                key={searchResetSignal}
                appLanguage={appLanguage}
                canEdit={canEdit}
                canZoomIn={previewZoomIndex < PREVIEW_ZOOM_STEPS.length - 1}
                canZoomOut={previewZoomIndex > 0}
                exportLabel={exportLabel}
                zoom={previewZoom}
                onEdit={workspace.startEditing}
                onExport={workspace.exportSelectedDocument}
                onFocusReading={navigation.enterPreviewFocus}
                onResetZoom={() => setPreviewZoomIndex(DEFAULT_PREVIEW_ZOOM_INDEX)}
                onZoomIn={() =>
                  setPreviewZoomIndex((current) =>
                    Math.min(PREVIEW_ZOOM_STEPS.length - 1, current + 1),
                  )
                }
                onZoomOut={() => setPreviewZoomIndex((current) => Math.max(0, current - 1))}
              />
            </>
          )}
        </div>
      </header>

      {!workspace.isEditing && isSearchOpen ? (
        <DocumentSearchBar
          activeIndex={searchIndex}
          appLanguage={appLanguage}
          count={searchCount}
          query={searchQuery}
          onClose={resetSearch}
          onNext={goToNextSearchMatch}
          onPrevious={goToPreviousSearchMatch}
          onQueryChange={handleSearchQueryChange}
        />
      ) : null}

      {navigation.isPreviewFocus ? (
        <button
          className="preview-focus-exit"
          type="button"
          onClick={navigation.exitPreviewFocus}
          aria-label={t("exitFocusReading")}
        >
          <Minimize2 size={16} aria-hidden="true" />
        </button>
      ) : null}

      {workspace.isEditing ? (
        <label className="editor-wrap">
          <span>{t("markdownSource")}</span>
          <textarea
            value={workspace.editBuffer}
            onChange={(event) => workspace.updateEditBuffer(event.currentTarget.value)}
            spellCheck="false"
          />
        </label>
      ) : (
        <DocumentPreview
          key={selectedDocumentId}
          documentId={selectedDocumentId}
          documentFormat={documentFormat}
          appLanguage={appLanguage}
          readingProgressRatio={readingProgressRatio}
          searchIndex={searchIndex}
          searchQuery={searchQuery}
          source={selectedDocument?.markdown ?? ""}
          zoom={previewZoom}
          onReadingProgressChange={handleReadingProgressChange}
          onSearchResultChange={handleSearchResultChange}
          onScrollDirectionChange={navigation.handleHtmlScrollDirection}
        />
      )}
    </section>
  )
}
