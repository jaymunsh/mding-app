import { useEffect, useMemo, useState } from "react"
import { assertNever } from "../domain/result"
import { findNode } from "../domain/tree"
import type { WorkspaceNode, WorkspaceSnapshot } from "../domain/workspace"
import { type NodeId, NodeKind, type WorkspaceDocument } from "../domain/workspace"
import { createWorkspaceRepository } from "../storage/workspaceRepository"
import { readLastBackupAt } from "./backupStatus"
import { registerDocumentLaunchHandler } from "./fileLaunch"
import { openLaunchedDocumentFiles } from "./fileLaunchActions"
import { readReadingProgress, updateReadingProgress, writeReadingProgress } from "./readingProgress"
import {
  createItem,
  initializeWorkspace,
  type MutationOutcome,
  moveSelected,
  moveNodes as moveWorkspaceNodes,
  saveSelectedDocument,
  selectNode,
  setFilePinned,
} from "./workspaceActions"
import {
  deleteSelected,
  deleteNodes as deleteWorkspaceNodes,
  restoreDeletedSnapshot,
} from "./workspaceDeleteActions"
import { renameSelected } from "./workspaceRenameActions"
import { initialState, messageFromError, Screen } from "./workspaceState"
import {
  exportSelectedDocument,
  exportWorkspace,
  importDocumentFiles,
  importWorkspaceFile,
} from "./workspaceTransferActions"

export { Screen }

export type WorkspaceController = {
  readonly nodes: readonly WorkspaceNode[]
  readonly selectedNode: WorkspaceNode | null
  readonly selectedDocument: WorkspaceDocument | null
  readonly editBuffer: string
  readonly isEditing: boolean
  readonly isDirty: boolean
  readonly screen: Screen
  readonly errorMessage: string | null
  readonly storagePersisted: boolean
  readonly lastBackupAt: number | null
  readonly pendingDeletionCount: number
  readonly readingProgress: Readonly<Record<string, number>>
  readonly selectNode: (id: NodeId) => Promise<void>
  readonly selectNodeInTree: (id: NodeId) => Promise<void>
  readonly showBrowser: () => void
  readonly startEditing: () => void
  readonly cancelEditing: () => void
  readonly updateEditBuffer: (value: string) => void
  readonly saveSelectedDocument: () => Promise<void>
  readonly createFile: (name?: string) => Promise<MutationOutcome>
  readonly createFolder: (name: string) => Promise<MutationOutcome>
  readonly renameSelected: (name: string) => Promise<void>
  readonly deleteSelected: () => Promise<void>
  readonly deleteNodes: (ids: readonly NodeId[]) => Promise<void>
  readonly dismissPendingDeletion: () => void
  readonly undoPendingDeletion: () => Promise<void>
  readonly moveSelectedToRoot: () => Promise<MutationOutcome>
  readonly moveSelectedToFolder: (id: NodeId) => Promise<MutationOutcome>
  readonly moveNodesToRoot: (ids: readonly NodeId[]) => Promise<MutationOutcome>
  readonly moveNodesToFolder: (ids: readonly NodeId[], id: NodeId) => Promise<MutationOutcome>
  readonly setFilePinned?: (id: NodeId, pinned: boolean) => Promise<MutationOutcome>
  readonly importDocumentFiles: (files: readonly File[]) => Promise<void>
  readonly importWorkspaceFile: (file: File) => Promise<void>
  readonly exportSelectedDocument: () => void
  readonly exportWorkspace: () => Promise<void>
  readonly setDocumentReadingProgress: (id: string, ratio: number) => void
  readonly clearError: () => void
}

export function useWorkspaceController(): WorkspaceController {
  const [state, setState] = useState(() => ({
    ...initialState,
    lastBackupAt: readLastBackupAt(),
    readingProgress: readReadingProgress(),
  }))
  const [pendingDeletion, setPendingDeletion] = useState<WorkspaceSnapshot | null>(null)
  const repository = useMemo(() => createWorkspaceRepository(), [])

  useEffect(() => {
    void initializeWorkspace(repository, setState)
  }, [repository])

  useEffect(() => {
    if (pendingDeletion === null) {
      return
    }
    const timeout = window.setTimeout(() => setPendingDeletion(null), 5000)
    return () => window.clearTimeout(timeout)
  }, [pendingDeletion])

  useEffect(() => {
    registerDocumentLaunchHandler({
      openFiles: (files) => openLaunchedDocumentFiles({ repository, setState, files }),
      reportError: (message) => setState((current) => ({ ...current, errorMessage: message })),
    })
  }, [repository])

  const selectedNode = findNode(state.nodes, state.selectedId)
  const isDirty = state.selectedDocument?.markdown !== state.editBuffer

  return {
    nodes: state.nodes,
    selectedNode,
    selectedDocument: state.selectedDocument,
    editBuffer: state.editBuffer,
    isEditing: state.isEditing,
    isDirty,
    screen: state.screen,
    errorMessage: state.errorMessage,
    storagePersisted: state.storagePersisted,
    lastBackupAt: state.lastBackupAt,
    pendingDeletionCount: pendingDeletion?.nodes.length ?? 0,
    readingProgress: state.readingProgress,
    selectNode: (id) => selectNode(repository, setState, id),
    selectNodeInTree: async (id) => {
      try {
        const nodes = await repository.listNodes()
        const node = findNode(nodes, id)
        const document = node?.kind === NodeKind.File ? await repository.getDocument(id) : null
        setState((current) => ({
          ...current,
          nodes,
          selectedId: id,
          selectedDocument: document,
          editBuffer: document?.markdown ?? "",
          isEditing: false,
          errorMessage: null,
        }))
      } catch (error) {
        setState((current) => ({ ...current, errorMessage: messageFromError(error) }))
      }
    },
    showBrowser: () => setState((current) => ({ ...current, screen: Screen.Browser })),
    startEditing: () => setState((current) => ({ ...current, isEditing: true })),
    cancelEditing: () =>
      setState((current) => ({
        ...current,
        editBuffer: current.selectedDocument?.markdown ?? "",
        isEditing: false,
      })),
    updateEditBuffer: (value) => setState((current) => ({ ...current, editBuffer: value })),
    saveSelectedDocument: () =>
      saveSelectedDocument(repository, setState, state.selectedDocument, state.editBuffer),
    createFile: (name) =>
      createItem({
        repository,
        setState,
        selectedId: state.selectedId,
        kind: NodeKind.File,
        name,
      }),
    createFolder: (name) =>
      createItem({
        repository,
        setState,
        selectedId: state.selectedId,
        kind: NodeKind.Folder,
        name,
      }),
    renameSelected: (name) => renameSelected(repository, setState, state.selectedId, name),
    deleteSelected: () => deleteSelected(repository, setState, state.nodes, state.selectedId),
    deleteNodes: async (ids) => {
      const deletedSnapshot = await deleteWorkspaceNodes({
        repository,
        setState,
        nodes: state.nodes,
        selectedIds: ids,
      })
      setPendingDeletion(deletedSnapshot)
    },
    dismissPendingDeletion: () => setPendingDeletion(null),
    undoPendingDeletion: async () => {
      if (pendingDeletion === null) {
        return
      }
      await restoreDeletedSnapshot(repository, setState, pendingDeletion)
      setPendingDeletion(null)
    },
    moveSelectedToRoot: () =>
      moveSelected({
        repository,
        setState,
        selectedId: state.selectedId,
        parentId: null,
      }),
    moveSelectedToFolder: (id) =>
      moveSelected({
        repository,
        setState,
        selectedId: state.selectedId,
        parentId: id,
      }),
    moveNodesToRoot: (ids) =>
      moveWorkspaceNodes({
        repository,
        setState,
        selectedIds: ids,
        parentId: null,
      }),
    moveNodesToFolder: (ids, id) =>
      moveWorkspaceNodes({
        repository,
        setState,
        selectedIds: ids,
        parentId: id,
      }),
    setFilePinned: (id, pinned) =>
      setFilePinned({
        repository,
        setState,
        id,
        pinned,
      }),
    importDocumentFiles: (files) =>
      importDocumentFiles({
        repository,
        setState,
        files,
      }),
    importWorkspaceFile: (file) => importWorkspaceFile(repository, setState, file),
    exportSelectedDocument: () => exportSelectedDocument(selectedNode, state.selectedDocument),
    exportWorkspace: () => exportWorkspace(repository, setState),
    setDocumentReadingProgress: (id, ratio) =>
      setState((current) => {
        const readingProgress = updateReadingProgress(current.readingProgress, id, ratio)
        if (readingProgress === current.readingProgress) {
          return current
        }
        writeReadingProgress(readingProgress)
        return { ...current, readingProgress }
      }),
    clearError: () => setState((current) => ({ ...current, errorMessage: null })),
  }
}

export function describeScreen(screen: Screen): string {
  switch (screen) {
    case Screen.Browser:
      return "Browser"
    case Screen.Document:
      return "Document"
    default:
      return assertNever(screen)
  }
}
