import { ChevronRight, FileText, Folder, FolderInput, Pencil, Trash2, Undo2, X } from "lucide-react"
import { useMemo, useState } from "react"
import type { WorkspaceController } from "../app/workspaceController"
import { buildTree, TreeSortOrder } from "../domain/tree"
import { NodeKind, type TreeNode } from "../domain/workspace"
import { canUseMoveTarget, findTreeNode, formatEditedTime, nextSortOrder } from "./fileTreeModel"

type FileTreeProps = {
  readonly workspace: WorkspaceController
}

export function FileTree({ workspace }: FileTreeProps) {
  const [renameText, setRenameText] = useState("")
  const [sortOrder, setSortOrder] = useState<TreeSortOrder>(TreeSortOrder.Updated)
  const [isManaging, setIsManaging] = useState(false)
  const [isChoosingMoveTarget, setIsChoosingMoveTarget] = useState(false)
  const tree = useMemo(() => buildTree(workspace.nodes, sortOrder), [workspace.nodes, sortOrder])
  const selectedTreeNode = findTreeNode(tree, workspace.selectedNode?.id ?? null)
  const selectedName = workspace.selectedNode?.name ?? ""
  const sortLabel = sortOrder === TreeSortOrder.Updated ? "Latest" : "Name"

  function toggleManageMode(): void {
    if (isManaging) {
      setRenameText("")
    }
    setIsChoosingMoveTarget(false)
    setIsManaging((current) => !current)
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
          {isChoosingMoveTarget ? (
            <small>Move {selectedName}: choose folder</small>
          ) : isManaging ? (
            <small>Manage mode</small>
          ) : null}
        </div>
        <span>{workspace.nodes.length} items</span>
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
              selectedTreeNode={selectedTreeNode}
              onMoveDone={() => {
                setIsChoosingMoveTarget(false)
                setIsManaging(false)
                setRenameText("")
              }}
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
              void workspace.moveSelectedToRoot().then(() => {
                setIsChoosingMoveTarget(false)
                setIsManaging(false)
                setRenameText("")
              })
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
          disabled={!isManaging || workspace.selectedNode === null}
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
  readonly selectedTreeNode: TreeNode | null
  readonly onMoveDone: () => void
  readonly onManageSelectionChange: () => void
}

function TreeRow({
  node,
  depth,
  workspace,
  isManaging,
  isChoosingMoveTarget,
  selectedTreeNode,
  onMoveDone,
  onManageSelectionChange,
}: TreeRowProps) {
  const [expanded, setExpanded] = useState(true)
  const isSelected = workspace.selectedNode?.id === node.id
  const hasChildren = node.children.length > 0
  const padding = `${12 + depth * 14}px`
  const canMoveHere = isChoosingMoveTarget && canUseMoveTarget(node, selectedTreeNode)

  return (
    <div className="tree-node">
      <button
        className={treeRowClassName(isSelected, canMoveHere)}
        type="button"
        style={{ paddingLeft: padding }}
        aria-expanded={node.kind === NodeKind.Folder && hasChildren ? expanded : undefined}
        disabled={isChoosingMoveTarget && !canMoveHere}
        onClick={() => {
          if (isChoosingMoveTarget) {
            void workspace.moveSelectedToFolder(node.id).then(onMoveDone)
            return
          }
          if (node.kind === NodeKind.Folder && hasChildren) {
            setExpanded((value) => !value)
          }
          if (isManaging) {
            onManageSelectionChange()
            void workspace.selectNodeInTree(node.id)
            return
          }
          void workspace.selectNode(node.id)
        }}
      >
        {node.kind === NodeKind.Folder && hasChildren ? (
          <ChevronRight
            className={expanded ? "disclosure open" : "disclosure"}
            size={15}
            aria-hidden="true"
          />
        ) : (
          <span className="disclosure" />
        )}
        {node.kind === NodeKind.Folder ? (
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
              selectedTreeNode={selectedTreeNode}
              onMoveDone={onMoveDone}
              onManageSelectionChange={onManageSelectionChange}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function treeRowClassName(isSelected: boolean, canMoveHere: boolean): string {
  return ["tree-row", isSelected ? "selected" : "", canMoveHere ? "move-target" : ""]
    .filter(Boolean)
    .join(" ")
}
