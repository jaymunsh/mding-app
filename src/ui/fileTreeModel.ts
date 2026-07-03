import { TreeSortOrder } from "../domain/tree"
import { type NodeId, NodeKind, type TreeNode } from "../domain/workspace"

export function nextSortOrder(sortOrder: TreeSortOrder): TreeSortOrder {
  return sortOrder === TreeSortOrder.Updated ? TreeSortOrder.Name : TreeSortOrder.Updated
}

export function canUseMoveTarget(node: TreeNode, selectedTreeNodes: readonly TreeNode[]): boolean {
  if (selectedTreeNodes.length === 0 || node.kind !== NodeKind.Folder) {
    return false
  }

  return selectedTreeNodes.every(
    (selectedTreeNode) =>
      node.id !== selectedTreeNode.id && !treeContainsNode(selectedTreeNode, node.id),
  )
}

export function findTreeNode(nodes: readonly TreeNode[], id: NodeId | null): TreeNode | null {
  if (id === null) {
    return null
  }

  for (const node of nodes) {
    if (node.id === id) {
      return node
    }
    const child = findTreeNode(node.children, id)
    if (child !== null) {
      return child
    }
  }

  return null
}

export function formatEditedTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) {
    return `Edited ${timeFormatter.format(date)}`
  }
  if (date.getFullYear() === now.getFullYear()) {
    return `Edited ${dayFormatter.format(date)}`
  }
  return `Edited ${dateFormatter.format(date)}`
}

function treeContainsNode(node: TreeNode, id: NodeId): boolean {
  return node.id === id || node.children.some((child) => treeContainsNode(child, id))
}

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
})

const dayFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
})

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
})
