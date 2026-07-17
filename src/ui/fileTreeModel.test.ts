import { describe, expect, it } from "vitest"
import { TreeSortOrder } from "../domain/tree"
import { createNodeId, NodeKind, type WorkspaceNode } from "../domain/workspace"
import { buildPinnedShortcuts, nextSortOrder } from "./fileTreeModel"

function file(
  name: string,
  parentId: WorkspaceNode["parentId"],
  updatedAt: number,
  pinned = false,
): WorkspaceNode {
  return {
    id: createNodeId(),
    parentId,
    kind: NodeKind.File,
    name,
    createdAt: updatedAt,
    updatedAt,
    pinned,
  }
}

describe("file tree model", () => {
  it("builds only file shortcuts in the active order without retaining their folder parent", () => {
    // Given
    const folder = {
      id: createNodeId(),
      parentId: null,
      kind: NodeKind.Folder,
      name: "Notes",
      createdAt: 1,
      updatedAt: 1,
    } satisfies WorkspaceNode
    const nestedPinned = file("Zeta.md", folder.id, 10, true)
    const rootPinned = file("Alpha.md", null, 20, true)
    const unpinned = file("Pinned later.md", null, 30)

    // When
    const latest = buildPinnedShortcuts(
      [folder, nestedPinned, rootPinned, unpinned],
      TreeSortOrder.Updated,
    )
    const named = buildPinnedShortcuts(
      [folder, nestedPinned, rootPinned, unpinned],
      TreeSortOrder.Name,
    )

    // Then
    expect(latest.map((node) => node.name)).toEqual(["Alpha.md", "Zeta.md"])
    expect(named.map((node) => node.name)).toEqual(["Alpha.md", "Zeta.md"])
    expect(latest.every((node) => node.kind === NodeKind.File && node.parentId === null)).toBe(true)
    expect(latest.every((node) => node.children.length === 0)).toBe(true)
  })

  it("toggles only between the existing Latest and Name modes", () => {
    expect(nextSortOrder(TreeSortOrder.Updated)).toBe(TreeSortOrder.Name)
    expect(nextSortOrder(TreeSortOrder.Name)).toBe(TreeSortOrder.Updated)
  })
})
