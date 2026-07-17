import { buildTree, TreeSortOrder } from "../domain/tree"
import { type NodeId, NodeKind, type TreeNode, type WorkspaceNode } from "../domain/workspace"

export function nextSortOrder(sortOrder: TreeSortOrder): TreeSortOrder {
  return sortOrder === TreeSortOrder.Updated ? TreeSortOrder.Name : TreeSortOrder.Updated
}

export function buildPinnedShortcuts(
  nodes: readonly WorkspaceNode[],
  sortOrder: TreeSortOrder,
): readonly TreeNode[] {
  const pinnedFiles = nodes
    .filter((node) => node.kind === NodeKind.File && node.pinned === true)
    .map((node) => ({ ...node, parentId: null }))

  return buildTree(pinnedFiles, sortOrder)
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

function treeContainsNode(node: TreeNode, id: NodeId): boolean {
  return node.id === id || node.children.some((child) => treeContainsNode(child, id))
}
