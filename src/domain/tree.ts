import { type NodeId, NodeKind, type TreeNode, type WorkspaceNode } from "./workspace"

export const TreeSortOrder = {
  Name: "name",
  Updated: "updated",
} as const

export type TreeSortOrder = (typeof TreeSortOrder)[keyof typeof TreeSortOrder]

export function buildTree(
  nodes: readonly WorkspaceNode[],
  sortOrder: TreeSortOrder = TreeSortOrder.Name,
): readonly TreeNode[] {
  return buildChildren(nodes, null, sortOrder)
}

export function findNode(nodes: readonly WorkspaceNode[], id: NodeId | null): WorkspaceNode | null {
  if (id === null) {
    return null
  }

  return nodes.find((node) => node.id === id) ?? null
}

export function getFolderTarget(
  nodes: readonly WorkspaceNode[],
  selectedId: NodeId | null,
): NodeId | null {
  const selectedNode = findNode(nodes, selectedId)
  if (selectedNode === null) {
    return null
  }

  return selectedNode.kind === NodeKind.Folder ? selectedNode.id : selectedNode.parentId
}

export function uniqueName(
  nodes: readonly WorkspaceNode[],
  parentId: NodeId | null,
  baseName: string,
): string {
  const existingNames = new Set(
    nodes.filter((node) => node.parentId === parentId).map((node) => node.name.toLowerCase()),
  )

  if (!existingNames.has(baseName.toLowerCase())) {
    return baseName
  }

  const extensionIndex = baseName.lastIndexOf(".")
  const stem = extensionIndex > 0 ? baseName.slice(0, extensionIndex) : baseName
  const extension = extensionIndex > 0 ? baseName.slice(extensionIndex) : ""
  let index = 2

  while (existingNames.has(`${stem} ${index}${extension}`.toLowerCase())) {
    index += 1
  }

  return `${stem} ${index}${extension}`
}

function buildChildren(
  nodes: readonly WorkspaceNode[],
  parentId: NodeId | null,
  sortOrder: TreeSortOrder,
): readonly TreeNode[] {
  return nodes
    .filter((node) => node.parentId === parentId)
    .sort((left, right) => compareNodes(left, right, sortOrder))
    .map((node) => ({
      ...node,
      children: buildChildren(nodes, node.id, sortOrder),
    }))
}

function compareNodes(left: WorkspaceNode, right: WorkspaceNode, sortOrder: TreeSortOrder): number {
  if (left.kind !== right.kind) {
    return left.kind === NodeKind.Folder ? -1 : 1
  }

  if (sortOrder === TreeSortOrder.Updated && left.updatedAt !== right.updatedAt) {
    return right.updatedAt - left.updatedAt
  }

  return left.name.localeCompare(right.name, undefined, { sensitivity: "base", numeric: true })
}
