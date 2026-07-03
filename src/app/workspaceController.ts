import { useEffect, useMemo, useState } from "react"
import { assertNever } from "../domain/result"
import { buildTree, findNode } from "../domain/tree"
import type { WorkspaceNode } from "../domain/workspace"
import { type NodeId, NodeKind, type TreeNode, type WorkspaceDocument } from "../domain/workspace"
import { createWorkspaceRepository } from "../storage/workspaceRepository"
import { registerDocumentLaunchHandler } from "./fileLaunch"
import { openLaunchedDocumentFiles } from "./fileLaunchActions"
import {
  createItem,
  deleteSelected,
  initializeWorkspace,
  moveSelectedToRoot,
  renameSelected,
  saveSelectedDocument,
  selectNode,
} from "./workspaceActions"
import { initialState, Screen } from "./workspaceState"
import {
  exportSelectedDocument,
  exportWorkspace,
  importDocumentFiles,
  importWorkspaceFile,
} from "./workspaceTransferActions"

export { Screen }

export type WorkspaceController = {
  readonly nodes: readonly WorkspaceNode[]
  readonly tree: readonly TreeNode[]
  readonly selectedNode: WorkspaceNode | null
  readonly selectedDocument: WorkspaceDocument | null
  readonly editBuffer: string
  readonly isEditing: boolean
  readonly isDirty: boolean
  readonly screen: Screen
  readonly errorMessage: string | null
  readonly storagePersisted: boolean
  readonly selectNode: (id: NodeId) => Promise<void>
  readonly showBrowser: () => void
  readonly startEditing: () => void
  readonly cancelEditing: () => void
  readonly updateEditBuffer: (value: string) => void
  readonly saveSelectedDocument: () => Promise<void>
  readonly createFile: () => Promise<void>
  readonly createFolder: () => Promise<void>
  readonly renameSelected: (name: string) => Promise<void>
  readonly deleteSelected: () => Promise<void>
  readonly moveSelectedToRoot: () => Promise<void>
  readonly importDocumentFiles: (files: readonly File[]) => Promise<void>
  readonly importWorkspaceFile: (file: File) => Promise<void>
  readonly exportSelectedDocument: () => void
  readonly exportWorkspace: () => Promise<void>
  readonly clearError: () => void
}

export function useWorkspaceController(): WorkspaceController {
  const [state, setState] = useState(initialState)
  const repository = useMemo(() => createWorkspaceRepository(), [])

  useEffect(() => {
    void initializeWorkspace(repository, setState)
  }, [repository])

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
    tree: buildTree(state.nodes),
    selectedNode,
    selectedDocument: state.selectedDocument,
    editBuffer: state.editBuffer,
    isEditing: state.isEditing,
    isDirty,
    screen: state.screen,
    errorMessage: state.errorMessage,
    storagePersisted: state.storagePersisted,
    selectNode: (id) => selectNode(repository, setState, id),
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
    createFile: () =>
      createItem({
        repository,
        setState,
        nodes: state.nodes,
        selectedId: state.selectedId,
        kind: NodeKind.File,
      }),
    createFolder: () =>
      createItem({
        repository,
        setState,
        nodes: state.nodes,
        selectedId: state.selectedId,
        kind: NodeKind.Folder,
      }),
    renameSelected: (name) => renameSelected(repository, setState, state.selectedId, name),
    deleteSelected: () => deleteSelected(repository, setState, state.nodes, state.selectedId),
    moveSelectedToRoot: () => moveSelectedToRoot(repository, setState, state.selectedId),
    importDocumentFiles: (files) =>
      importDocumentFiles({
        repository,
        setState,
        nodes: state.nodes,
        selectedId: state.selectedId,
        files,
      }),
    importWorkspaceFile: (file) => importWorkspaceFile(repository, setState, file),
    exportSelectedDocument: () => exportSelectedDocument(selectedNode, state.selectedDocument),
    exportWorkspace: () => exportWorkspace(repository, setState),
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
