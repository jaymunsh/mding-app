import { Check, FolderInput, PanelLeftClose, Pencil, Trash2, Undo2, X } from "lucide-react"
import { type DragEvent, useEffect, useMemo, useRef, useState } from "react"
import { type AppLanguage, translate } from "../app/i18n"
import type { WorkspaceController } from "../app/workspaceController"
import { assertNever } from "../domain/result"
import { buildTree, TreeSortOrder } from "../domain/tree"
import type { NodeId, TreeNode } from "../domain/workspace"
import {
  type DragTargetId,
  FileTreeRow,
  type FileTreeRowContext,
  INTERNAL_DRAG_TYPE,
  type MoveDestination,
  ROOT_DRAG_TARGET,
} from "./FileTreeRow"
import { buildPinnedShortcuts, findTreeNode, nextSortOrder } from "./fileTreeModel"

type FileTreeProps = {
  readonly appLanguage: AppLanguage
  readonly workspace: WorkspaceController
  readonly onCollapseSidebar: () => void
}

export function FileTree({ appLanguage, workspace, onCollapseSidebar }: FileTreeProps) {
  const [renameText, setRenameText] = useState("")
  const [sortOrder, setSortOrder] = useState<TreeSortOrder>(TreeSortOrder.Updated)
  const [isManaging, setIsManaging] = useState(false)
  const [isChoosingMoveTarget, setIsChoosingMoveTarget] = useState(false)
  const [managedSelectionIds, setManagedSelectionIds] = useState<readonly NodeId[]>([])
  const [draggedNodeIds, setDraggedNodeIds] = useState<readonly NodeId[]>([])
  const [dragTargetId, setDragTargetId] = useState<DragTargetId>(null)
  const [moveToast, setMoveToast] = useState<MoveDestination | null>(null)
  const moveToastTimerRef = useRef<number | null>(null)
  const tree = useMemo(() => buildTree(workspace.nodes, sortOrder), [workspace.nodes, sortOrder])
  const pinnedShortcuts = useMemo(
    () => buildPinnedShortcuts(workspace.nodes, sortOrder),
    [workspace.nodes, sortOrder],
  )
  const managedSelectedTreeNodes = findTreeNodes(tree, managedSelectionIds)
  const draggedTreeNodes = findTreeNodes(tree, draggedNodeIds)
  const canDropToRoot = canMoveToRoot(draggedNodeIds, draggedTreeNodes)
  const managedSelectionCount = managedSelectedTreeNodes.length
  const sortLabel =
    sortOrder === TreeSortOrder.Updated
      ? translate(appLanguage, "latest")
      : translate(appLanguage, "name")

  useEffect(
    () => () => {
      if (moveToastTimerRef.current !== null) {
        window.clearTimeout(moveToastTimerRef.current)
      }
    },
    [],
  )

  function resetManageMode(): void {
    setIsManaging(false)
    setIsChoosingMoveTarget(false)
    setRenameText("")
    setManagedSelectionIds([])
  }

  function resetDrag(): void {
    setDraggedNodeIds([])
    setDragTargetId(null)
  }

  function showMoveSuccess(destination: MoveDestination): void {
    if (moveToastTimerRef.current !== null) {
      window.clearTimeout(moveToastTimerRef.current)
    }
    setMoveToast(destination)
    moveToastTimerRef.current = window.setTimeout(() => {
      setMoveToast(null)
      moveToastTimerRef.current = null
    }, 2400)
  }

  function handleRootDrop(event: DragEvent<HTMLDivElement>): void {
    if (!isInternalDrag(event)) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    if (!canDropToRoot) {
      resetDrag()
      return
    }
    void workspace.moveNodesToRoot(draggedNodeIds).then((outcome) => {
      if (outcome.kind === "success") {
        showMoveSuccess({ kind: "root" })
      }
      resetDrag()
    })
  }

  function handleRootDragEnter(event: DragEvent<HTMLDivElement>): void {
    if (!isInternalDrag(event)) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    setDragTargetId(canDropToRoot ? ROOT_DRAG_TARGET : null)
  }

  function handleRootDragOver(event: DragEvent<HTMLDivElement>): void {
    if (!isInternalDrag(event)) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = canDropToRoot ? "move" : "none"
  }

  function handleTreeDragEnter(event: DragEvent<HTMLDivElement>): void {
    if (!isInternalDrag(event)) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    setDragTargetId(null)
  }

  function handleTreeDrop(event: DragEvent<HTMLDivElement>): void {
    if (!isInternalDrag(event)) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    resetDrag()
  }

  const rowContext: FileTreeRowContext = {
    appLanguage,
    workspace,
    isManaging,
    isChoosingMoveTarget,
    managedSelectionIds,
    managedSelectedTreeNodes,
    draggedNodeIds,
    draggedTreeNodes,
    dragTargetId,
    onMoveSuccess: showMoveSuccess,
    onToggleManagedSelection: (id) =>
      setManagedSelectionIds((current) =>
        current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
      ),
    onMoveDone: resetManageMode,
    onManageSelectionChange: () => setRenameText(""),
    onTogglePin: (id, pinned) => {
      void workspace.setFilePinned?.(id, pinned)
    },
    onDragStart: setDraggedNodeIds,
    onDragEnd: resetDrag,
    onDragTargetChange: setDragTargetId,
  }

  return (
    <div className={`file-tree ${isManaging ? "manage-mode" : ""}`}>
      <div className="panel-heading">
        <div className="panel-heading-main">
          <div className="panel-title-row">
            <span>{translate(appLanguage, "workspace")}</span>
            <button
              className="sort-trigger"
              type="button"
              onClick={() => setSortOrder(nextSortOrder(sortOrder))}
            >
              {sortLabel}
            </button>
          </div>
        </div>
        <div className="panel-heading-side">
          <span>{itemCountLabel(workspace.nodes.length, appLanguage)}</span>
          <button
            className="sidebar-collapse-button"
            type="button"
            onClick={onCollapseSidebar}
            aria-label={translate(appLanguage, "collapseSidebar")}
          >
            <PanelLeftClose size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {tree.length === 0 ? (
        <div className="empty-state">{translate(appLanguage, "createMarkdownStart")}</div>
      ) : (
        <div
          role="tree"
          aria-label={translate(appLanguage, "workspaceFiles")}
          className={dragTargetId === ROOT_DRAG_TARGET ? "tree-list root-drag-target" : "tree-list"}
          onDragEnter={handleTreeDragEnter}
          onDrop={handleTreeDrop}
        >
          {draggedNodeIds.length > 0 && canDropToRoot ? (
            <section
              className={
                dragTargetId === ROOT_DRAG_TARGET
                  ? "tree-root-drop-target root-drag-target"
                  : "tree-root-drop-target"
              }
              aria-label={translate(appLanguage, "moveToRoot")}
              onDragEnter={handleRootDragEnter}
              onDragOver={handleRootDragOver}
              onDragLeave={(event) => {
                if (isInternalDrag(event)) {
                  event.stopPropagation()
                  setDragTargetId(null)
                }
              }}
              onDrop={handleRootDrop}
            >
              <span className="tree-drop-target-label">{translate(appLanguage, "moveToRoot")}</span>
            </section>
          ) : null}
          {pinnedShortcuts.length > 0 ? (
            <section
              className="tree-section pinned-section"
              aria-labelledby="pinned-section-heading"
            >
              <h2 id="pinned-section-heading" className="tree-section-heading">
                {translate(appLanguage, "pinned")}
              </h2>
              {pinnedShortcuts.map((node) => (
                <FileTreeRow
                  key={`pinned-${node.id}`}
                  node={node}
                  depth={0}
                  isShortcut
                  context={rowContext}
                />
              ))}
            </section>
          ) : null}
          <section className="tree-section workspace-tree-section">
            {tree.map((node) => (
              <FileTreeRow key={node.id} node={node} depth={0} context={rowContext} />
            ))}
          </section>
        </div>
      )}

      {moveToast === null ? null : (
        <div className="undo-toast move-success-toast" role="status" aria-live="polite">
          <Check size={15} aria-hidden="true" />
          <span>{moveFeedbackLabel(appLanguage, moveToast)}</span>
        </div>
      )}

      {isChoosingMoveTarget ? (
        <div className="move-target-bar">
          <button
            type="button"
            onClick={() => {
              void workspace.moveNodesToRoot(managedSelectionIds).then((outcome) => {
                if (outcome.kind === "success") {
                  resetManageMode()
                }
              })
            }}
          >
            <Undo2 size={15} aria-hidden="true" />
            {translate(appLanguage, "moveRoot")}
          </button>
          <button type="button" onClick={() => setIsChoosingMoveTarget(false)}>
            <X size={15} aria-hidden="true" />
            {translate(appLanguage, "cancel")}
          </button>
        </div>
      ) : null}

      {isChoosingMoveTarget ? (
        <div className="tree-status">{translate(appLanguage, "moveChooseFolderSuffix")}</div>
      ) : null}

      {isManaging && managedSelectionCount === 1 ? (
        <form
          className="rename-form"
          onSubmit={(event) => {
            event.preventDefault()
            void workspace.renameSelected(renameText)
            setRenameText("")
          }}
        >
          <input
            type="text"
            placeholder={workspace.selectedNode?.name ?? translate(appLanguage, "renameSelected")}
            value={renameText}
            onChange={(event) => setRenameText(event.currentTarget.value)}
            aria-label={translate(appLanguage, "renameSelected")}
          />
          <button type="submit" disabled={workspace.selectedNode === null}>
            <Pencil size={15} aria-hidden="true" />
            {translate(appLanguage, "rename")}
          </button>
        </form>
      ) : null}

      {isManaging ? (
        <div className="manage-context-bar">
          <span role="status">
            {managedSelectionCount}
            {appLanguage === "ko" ? "" : " "}
            {translate(appLanguage, "selectedCount")}
          </span>
          <button
            type="button"
            disabled={managedSelectionCount === 0}
            onClick={() => setIsChoosingMoveTarget(true)}
            aria-label={translate(appLanguage, "move")}
          >
            <Undo2 size={15} aria-hidden="true" />
          </button>
          <button
            className="danger"
            type="button"
            disabled={managedSelectionCount === 0}
            onClick={() => void workspace.deleteNodes(managedSelectionIds).then(resetManageMode)}
            aria-label={translate(appLanguage, "delete")}
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
          <button type="button" onClick={resetManageMode}>
            {translate(appLanguage, "done")}
          </button>
        </div>
      ) : (
        <div className="tree-actions tree-actions-idle">
          <button type="button" onClick={() => setIsManaging(true)}>
            <FolderInput size={15} aria-hidden="true" />
            {translate(appLanguage, "manage")}
          </button>
        </div>
      )}
    </div>
  )
}

function findTreeNodes(tree: readonly TreeNode[], ids: readonly NodeId[]): readonly TreeNode[] {
  return ids.map((id) => findTreeNode(tree, id)).filter((node) => node !== null)
}

function itemCountLabel(count: number, language: AppLanguage): string {
  return language === "ko"
    ? `${count}${translate(language, "items")}`
    : `${count} ${translate(language, "items")}`
}

function canMoveToRoot(ids: readonly NodeId[], nodes: readonly TreeNode[]): boolean {
  return (
    ids.length > 0 && ids.length === nodes.length && nodes.every((node) => node.parentId !== null)
  )
}

function isInternalDrag(event: DragEvent<HTMLElement>): boolean {
  return event.dataTransfer.types.includes(INTERNAL_DRAG_TYPE)
}

function moveFeedbackLabel(language: AppLanguage, destination: MoveDestination): string {
  switch (destination.kind) {
    case "root":
      return translate(language, "movedToRoot")
    case "folder":
      return `${translate(language, "movedToFolder")}: ${destination.name}`
    default:
      return assertNever(destination)
  }
}
