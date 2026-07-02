import { ChevronRight, FileText, Folder, Pencil, Trash2, Undo2 } from "lucide-react"
import { useState } from "react"
import type { WorkspaceController } from "../app/workspaceController"
import { NodeKind, type TreeNode } from "../domain/workspace"

type FileTreeProps = {
  readonly workspace: WorkspaceController
}

export function FileTree({ workspace }: FileTreeProps) {
  const [renameText, setRenameText] = useState("")

  return (
    <div className="file-tree">
      <div className="panel-heading">
        <span>Workspace</span>
        <span>{workspace.nodes.length} items</span>
      </div>
      {workspace.tree.length === 0 ? (
        <div className="empty-state">Create a Markdown file to start.</div>
      ) : (
        <div className="tree-list">
          {workspace.tree.map((node) => (
            <TreeRow key={node.id} node={node} depth={0} workspace={workspace} />
          ))}
        </div>
      )}

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
        <button type="submit">
          <Pencil size={15} aria-hidden="true" />
          Rename
        </button>
      </form>

      <div className="tree-actions">
        <button type="button" onClick={workspace.moveSelectedToRoot}>
          <Undo2 size={15} aria-hidden="true" />
          Move root
        </button>
        <button className="danger" type="button" onClick={workspace.deleteSelected}>
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
}

function TreeRow({ node, depth, workspace }: TreeRowProps) {
  const [expanded, setExpanded] = useState(true)
  const isSelected = workspace.selectedNode?.id === node.id
  const hasChildren = node.children.length > 0
  const padding = `${12 + depth * 14}px`

  return (
    <div>
      <button
        className={`tree-row ${isSelected ? "selected" : ""}`}
        type="button"
        style={{ paddingLeft: padding }}
        onClick={() => {
          if (node.kind === NodeKind.Folder) {
            setExpanded((value) => !value)
          }
          void workspace.selectNode(node.id)
        }}
      >
        {node.kind === NodeKind.Folder ? (
          <ChevronRight className={expanded ? "disclosure open" : "disclosure"} size={15} />
        ) : (
          <span className="disclosure" />
        )}
        {node.kind === NodeKind.Folder ? (
          <Folder size={16} aria-hidden="true" />
        ) : (
          <FileText size={16} aria-hidden="true" />
        )}
        <span>{node.name}</span>
      </button>
      {node.kind === NodeKind.Folder && expanded && hasChildren ? (
        <div>
          {node.children.map((child) => (
            <TreeRow key={child.id} node={child} depth={depth + 1} workspace={workspace} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
