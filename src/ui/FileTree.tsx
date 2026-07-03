import { ChevronRight, FileText, Folder, FolderInput, Pencil, Trash2, Undo2, X } from "lucide-react"
import { useMemo, useState } from "react"
import type { WorkspaceController } from "../app/workspaceController"
import { buildTree, TreeSortOrder } from "../domain/tree"
import { type NodeId, NodeKind, type TreeNode } from "../domain/workspace"
import { canUseMoveTarget, findTreeNode, formatEditedTime, nextSortOrder } from "./fileTreeModel"

type FileTreeProps = {
  readonly workspace: WorkspaceController
}

export function FileTree({ workspace }: FileTreeProps) {
  const [renameText, setRenameText] = useState("")
  const [sortOrder, setSortOrder] = useState<TreeSortOrder>(TreeSortOrder.Updated)
  const [isManaging, setIsManaging] = useState(false)
  const [isChoosingMoveTarget, setIsChoosingMoveTarget] = useState(false)
  const [moveSelectionIds, setMoveSelectionIds] = useState<readonly NodeId[]>([])
  const tree = useMemo(() => buildTree(workspace.nodes, sortOrder), [workspace.nodes, sortOrder])
  const moveSelectedTreeNodes = moveSelectionIds
    .map((id) => findTreeNode(tree, id))
    .filter((node) => node !== null)
  const moveSelectionCount = moveSelectedTreeNodes.length
  const moveSelectionLabel =
    moveSelectionCount === 1
      ? (moveSelectedTreeNodes[0]?.name ?? "selected item")
      : `${moveSelectionCount} items`
  const sortLabel = sortOrder === TreeSortOrder.Updated ? "Latest" : "Name"

  function toggleManageMode(): void {
    if (isManaging) {
      setRenameText("")
      setMoveSelectionIds([])
    }
    setIsChoosingMoveTarget(false)
    setIsManaging((current) => !current)
  }

  function toggleMoveSelection(id: NodeId): void {
    setMoveSelectionIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    )
  }

  function resetMoveMode(): void {
    setIsChoosingMoveTarget(false)
    setIsManaging(false)
    setRenameText("")
    setMoveSelectionIds([])
  }

  return (
    <div className={`file-tree ${isManaging ? "manage-mode" : ""}`}>
      <div className="panel-heading">
        <div className="panel-heading-main">
          <div className="panel-title-row">
            <span>Workspace</span>
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
          <span>{workspace.nodes.length} items</span>
        </div>
      </div>
      {tree.length === 0 ? (
        <div className="empty-state">Create a Markdown file to start.</div>
      ) : (
        <div className="tree-list">
          {tree.map((node) => (
            <TreeRow
              key={node.id}
              node={node}
              depth={0}
              workspace={workspace}
              isManaging={isManaging}
              isChoosingMoveTarget={isChoosingMoveTarget}
              moveSelectionIds={moveSelectionIds}
              moveSelectedTreeNodes={moveSelectedTreeNodes}
              onToggleMoveSelection={toggleMoveSelection}
              onMoveDone={resetMoveMode}
              onManageSelectionChange={() => setRenameText("")}
            />
          ))}
        </div>
      )}

      {isChoosingMoveTarget ? (
        <div className="move-target-bar">
          <button
            type="button"
            onClick={() => {
              void workspace.moveNodesToRoot(moveSelectionIds).then(resetMoveMode)
            }}
          >
            <Undo2 size={15} aria-hidden="true" />
            Move root
          </button>
          <button type="button" onClick={() => setIsChoosingMoveTarget(false)}>
            <X size={15} aria-hidden="true" />
            Cancel
          </button>
        </div>
      ) : null}

      {isChoosingMoveTarget ? (
        <div className="tree-status">Move {moveSelectionLabel}: choose folder</div>
      ) : isManaging && moveSelectionCount > 0 ? (
        <div className="tree-status">{moveSelectionCount} selected for move</div>
      ) : null}

      {isManaging ? (
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
            placeholder={workspace.selectedNode?.name ?? "Rename selected"}
            value={renameText}
            onChange={(event) => setRenameText(event.currentTarget.value)}
            aria-label="Rename selected item"
          />
          <button type="submit" disabled={workspace.selectedNode === null}>
            <Pencil size={15} aria-hidden="true" />
            Rename
          </button>
        </form>
      ) : null}

      <div className="tree-actions">
        <button type="button" className={isManaging ? "selected" : ""} onClick={toggleManageMode}>
          <FolderInput size={15} aria-hidden="true" />
          {isManaging ? "Done" : "Manage"}
        </button>
        <button
          type="button"
          disabled={!isManaging || moveSelectionCount === 0}
          onClick={() => setIsChoosingMoveTarget(true)}
        >
          <Undo2 size={15} aria-hidden="true" />
          Move
        </button>
        <button
          className="danger"
          type="button"
          disabled={!isManaging || workspace.selectedNode === null}
          onClick={workspace.deleteSelected}
        >
          <Trash2 size={15} aria-hidden="true" />
          Delete
        </button>
      </div>
    </div>
  )
}

type TreeRowProps = {
  readonly node: TreeNode
  readonly depth: number
  readonly workspace: WorkspaceController
  readonly isManaging: boolean
  readonly isChoosingMoveTarget: boolean
  readonly moveSelectionIds: readonly NodeId[]
  readonly moveSelectedTreeNodes: readonly TreeNode[]
  readonly onToggleMoveSelection: (id: NodeId) => void
  readonly onMoveDone: () => void
  readonly onManageSelectionChange: () => void
}

function TreeRow({
  node,
  depth,
  workspace,
  isManaging,
  isChoosingMoveTarget,
  moveSelectionIds,
  moveSelectedTreeNodes,
  onToggleMoveSelection,
  onMoveDone,
  onManageSelectionChange,
}: TreeRowProps) {
  const [expanded, setExpanded] = useState(true)
  const isSelected = workspace.selectedNode?.id === node.id
  const isFolder = node.kind === NodeKind.Folder
  const isRootFile = node.kind === NodeKind.File && depth === 0
  const hasChildren = node.children.length > 0
  const isMoveSelected = moveSelectionIds.includes(node.id)
  const padding = `${12 + depth * 18}px`
  const canMoveHere = isChoosingMoveTarget && canUseMoveTarget(node, moveSelectedTreeNodes)

  return (
    <div className={treeNodeClassName(node.kind, hasChildren)}>
      <button
        className={treeRowClassName(isSelected, canMoveHere)}
        type="button"
        style={{ paddingLeft: padding }}
        aria-expanded={isFolder ? expanded : undefined}
        disabled={isChoosingMoveTarget && !canMoveHere}
        onClick={() => {
          if (isChoosingMoveTarget) {
            void workspace.moveNodesToFolder(moveSelectionIds, node.id).then(onMoveDone)
            return
          }
          if (isFolder) {
            setExpanded((value) => !value)
          }
          if (isManaging) {
            onManageSelectionChange()
            onToggleMoveSelection(node.id)
            void workspace.selectNodeInTree(node.id)
            return
          }
          void workspace.selectNode(node.id)
        }}
      >
        {isManaging ? (
          <span className={moveSelectClassName(isMoveSelected)} aria-hidden="true">
            {isMoveSelected ? "✓" : ""}
          </span>
        ) : null}
        {isFolder ? (
          <ChevronRight
            className={expanded ? "disclosure open" : "disclosure"}
            size={15}
            aria-hidden="true"
          />
        ) : isRootFile ? (
          <span className="root-marker" aria-hidden="true">
            √
          </span>
        ) : (
          <span className="disclosure" />
        )}
        {isFolder ? (
          <Folder size={16} aria-hidden="true" />
        ) : (
          <FileText size={16} aria-hidden="true" />
        )}
        <span className="tree-row-copy">
          <span className="tree-row-name">{node.name}</span>
          <span className="tree-row-meta">{formatEditedTime(node.updatedAt)}</span>
        </span>
      </button>
      {node.kind === NodeKind.Folder && expanded && hasChildren ? (
        <div className="tree-children">
          {node.children.map((child) => (
            <TreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              workspace={workspace}
              isManaging={isManaging}
              isChoosingMoveTarget={isChoosingMoveTarget}
              moveSelectionIds={moveSelectionIds}
              moveSelectedTreeNodes={moveSelectedTreeNodes}
              onToggleMoveSelection={onToggleMoveSelection}
              onMoveDone={onMoveDone}
              onManageSelectionChange={onManageSelectionChange}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function treeNodeClassName(kind: NodeKind, hasChildren: boolean): string {
  return [
    "tree-node",
    kind === NodeKind.Folder ? "folder-node" : "",
    hasChildren ? "has-children" : "",
  ]
    .filter(Boolean)
    .join(" ")
}

function treeRowClassName(isSelected: boolean, canMoveHere: boolean): string {
  return ["tree-row", isSelected ? "selected" : "", canMoveHere ? "move-target" : ""]
    .filter(Boolean)
    .join(" ")
}

function moveSelectClassName(isSelected: boolean): string {
  return ["move-select-indicator", isSelected ? "checked" : ""].filter(Boolean).join(" ")
}
