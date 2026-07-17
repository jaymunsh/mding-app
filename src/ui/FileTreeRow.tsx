import { ChevronRight, FileCode2, FileText, Folder, Pin } from "lucide-react"
import { type DragEvent, useState } from "react"
import { type AppLanguage, formatEditedTime, translate } from "../app/i18n"
import { formatReadingProgressPercent } from "../app/readingProgress"
import type { WorkspaceController } from "../app/workspaceController"
import { type NodeId, NodeKind, type TreeNode } from "../domain/workspace"
import { canUseMoveTarget } from "./fileTreeModel"

export const INTERNAL_DRAG_TYPE = "application/x-mding-node" as const
export const ROOT_DRAG_TARGET = "root" as const

export type DragTargetId = NodeId | typeof ROOT_DRAG_TARGET | null

export type MoveDestination =
  | { readonly kind: "root" }
  | { readonly kind: "folder"; readonly name: string }

export type FileTreeRowContext = {
  readonly appLanguage: AppLanguage
  readonly workspace: WorkspaceController
  readonly isManaging: boolean
  readonly isChoosingMoveTarget: boolean
  readonly managedSelectionIds: readonly NodeId[]
  readonly managedSelectedTreeNodes: readonly TreeNode[]
  readonly draggedNodeIds: readonly NodeId[]
  readonly draggedTreeNodes: readonly TreeNode[]
  readonly dragTargetId: DragTargetId
  readonly onToggleManagedSelection: (id: NodeId) => void
  readonly onMoveDone: () => void
  readonly onMoveSuccess?: (destination: MoveDestination) => void
  readonly onManageSelectionChange: () => void
  readonly onDragStart: (ids: readonly NodeId[]) => void
  readonly onDragEnd: () => void
  readonly onDragTargetChange: (id: DragTargetId) => void
}

type FileTreeRowProps = {
  readonly node: TreeNode
  readonly depth: number
  readonly isShortcut?: boolean
  readonly context: FileTreeRowContext
}

export function FileTreeRow({ node, depth, isShortcut = false, context }: FileTreeRowProps) {
  const [expanded, setExpanded] = useState(true)
  const isFolder = node.kind === NodeKind.Folder
  const isRootFile = node.kind === NodeKind.File && depth === 0 && !isShortcut
  const hasChildren = node.children.length > 0
  const isManagedSelected = context.managedSelectionIds.includes(node.id)
  const canDrag = !context.isChoosingMoveTarget && !isShortcut
  const readingProgressLabel =
    node.kind === NodeKind.File
      ? formatReadingProgressPercent(context.workspace.readingProgress[node.id])
      : null
  const canMoveHere =
    context.isChoosingMoveTarget && canUseMoveTarget(node, context.managedSelectedTreeNodes)
  const canDropHere =
    isFolder &&
    context.draggedNodeIds.length > 0 &&
    context.draggedTreeNodes.length === context.draggedNodeIds.length &&
    canUseMoveTarget(node, context.draggedTreeNodes)
  const draggedIds = isManagedSelected ? context.managedSelectionIds : [node.id]
  const isDragTarget = canDropHere && context.dragTargetId === node.id

  function handleDrop(event: DragEvent<HTMLButtonElement>): void {
    if (!isInternalDrag(event)) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    if (!canDropHere) {
      return
    }
    void context.workspace.moveNodesToFolder(context.draggedNodeIds, node.id).then((outcome) => {
      if (outcome.kind === "success") {
        context.onMoveSuccess?.({ kind: "folder", name: node.name })
        context.onMoveDone()
      }
      context.onDragEnd()
    })
  }

  return (
    <div className={treeNodeClassName(node.kind, hasChildren)}>
      <div className="tree-row-shell">
        <button
          className={treeRowClassName(
            context.isManaging && isManagedSelected,
            canMoveHere,
            isDragTarget,
            node.kind,
            isShortcut,
          )}
          type="button"
          data-node-id={node.id}
          style={{ paddingLeft: `${12 + depth * 18}px` }}
          aria-expanded={isFolder ? expanded : undefined}
          aria-label={
            isDragTarget
              ? `${translate(context.appLanguage, "moveToFolder")}: ${node.name}`
              : undefined
          }
          disabled={context.isChoosingMoveTarget && !canMoveHere}
          draggable={canDrag}
          onDragStart={(event) => {
            event.stopPropagation()
            event.dataTransfer.effectAllowed = "move"
            event.dataTransfer.setData(INTERNAL_DRAG_TYPE, node.id)
            event.dataTransfer.setData("text/plain", node.id)
            context.onDragStart(draggedIds)
          }}
          onDragEnd={context.onDragEnd}
          onDragEnter={(event) => {
            if (!isInternalDrag(event)) {
              return
            }
            event.preventDefault()
            event.stopPropagation()
            context.onDragTargetChange(canDropHere ? node.id : null)
          }}
          onDragOver={(event) => {
            if (!isInternalDrag(event)) {
              return
            }
            event.preventDefault()
            event.stopPropagation()
            event.dataTransfer.dropEffect = canDropHere ? "move" : "none"
          }}
          onDragLeave={(event) => {
            if (!isInternalDrag(event)) {
              return
            }
            event.stopPropagation()
            if (context.dragTargetId === node.id) {
              context.onDragTargetChange(null)
            }
          }}
          onDrop={handleDrop}
          onClick={() => {
            if (context.isChoosingMoveTarget) {
              void context.workspace
                .moveNodesToFolder(context.managedSelectionIds, node.id)
                .then((outcome) => {
                  if (outcome.kind === "success") {
                    context.onMoveDone()
                  }
                })
              return
            }
            if (isFolder) {
              setExpanded((value) => !value)
            }
            if (context.isManaging) {
              context.onManageSelectionChange()
              context.onToggleManagedSelection(node.id)
              void context.workspace.selectNodeInTree(node.id)
              return
            }
            void context.workspace.selectNode(node.id)
          }}
        >
          {context.isManaging ? (
            <span
              className={
                isManagedSelected ? "move-select-indicator checked" : "move-select-indicator"
              }
              aria-hidden="true"
            >
              {isManagedSelected ? "✓" : ""}
            </span>
          ) : null}
          {isFolder ? (
            <ChevronRight
              className={expanded ? "disclosure open" : "disclosure"}
              size={15}
              aria-hidden="true"
            />
          ) : isShortcut ? (
            <Pin className="shortcut-marker" size={15} aria-hidden="true" />
          ) : isRootFile ? (
            <span className="root-marker" aria-hidden="true">
              √
            </span>
          ) : (
            <span className="disclosure" />
          )}
          {isFolder ? (
            <Folder size={16} aria-hidden="true" />
          ) : node.name.toLowerCase().endsWith(".html") ? (
            <FileCode2 className="file-format-icon html" size={16} aria-hidden="true" />
          ) : (
            <FileText className="file-format-icon markdown" size={16} aria-hidden="true" />
          )}
          <span className="tree-row-copy">
            <span className="tree-row-name">{node.name}</span>
            {isDragTarget ? (
              <span className="tree-row-drop-label">
                {translate(context.appLanguage, "moveToFolder")}: {node.name}
              </span>
            ) : (
              <span className="tree-row-meta-line">
                <span className="tree-row-meta">
                  {formatEditedTime(node.updatedAt, context.appLanguage)}
                </span>
                {readingProgressLabel === null ? null : (
                  <span className="tree-row-progress">{readingProgressLabel}</span>
                )}
              </span>
            )}
          </span>
        </button>
      </div>
      {isFolder && expanded && hasChildren ? (
        <div className="tree-children">
          {node.children.map((child) => (
            <FileTreeRow key={child.id} node={child} depth={depth + 1} context={context} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function isInternalDrag(event: DragEvent<HTMLElement>): boolean {
  return event.dataTransfer.types.includes(INTERNAL_DRAG_TYPE)
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

function treeRowClassName(
  isSelected: boolean,
  canMoveHere: boolean,
  isDragTarget: boolean,
  kind: NodeKind,
  isShortcut: boolean,
): string {
  return [
    "tree-row",
    isSelected ? "selected" : "",
    canMoveHere ? "move-target" : "",
    isDragTarget ? "drag-target" : "",
    kind === NodeKind.Folder ? "folder-row" : "file-row",
    isShortcut ? "shortcut-row" : "",
  ]
    .filter(Boolean)
    .join(" ")
}
