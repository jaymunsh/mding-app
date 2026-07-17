import { describe, expect, it } from "vitest"
import { buildTree, getFolderTarget, moveNodesToParent, TreeSortOrder, uniqueName } from "./tree"
import { createNodeId, NodeKind, type WorkspaceNode } from "./workspace"

function node(kind: NodeKind, name: string, parentId: WorkspaceNode["parentId"]): WorkspaceNode {
  const now = 1
  return {
    id: createNodeId(),
    parentId,
    kind,
    name,
    createdAt: now,
    updatedAt: now,
  }
}

function touch(node: WorkspaceNode, updatedAt: number): WorkspaceNode {
  return { ...node, updatedAt }
}

describe("workspace tree", () => {
  it("keeps folders first while ordering siblings by the selected sort mode", () => {
    // Given
    const archive = touch(node(NodeKind.Folder, "Archive", null), 2)
    const notes = touch(node(NodeKind.Folder, "Notes", null), 4)
    const readme = touch(node(NodeKind.File, "Readme.md", null), 1)
    const today = touch(node(NodeKind.File, "Today.md", null), 3)

    // When
    const latestTree = buildTree([today, archive, readme, notes], TreeSortOrder.Updated)
    const nameTree = buildTree([today, archive, readme, notes], TreeSortOrder.Name)

    // Then
    expect(latestTree.map((item) => item.name)).toEqual([
      "Notes",
      "Archive",
      "Today.md",
      "Readme.md",
    ])
    expect(nameTree.map((item) => item.name)).toEqual(["Archive", "Notes", "Readme.md", "Today.md"])
  })

  it("orders folders before files and nests children when building the tree", () => {
    const folder = node(NodeKind.Folder, "Notes", null)
    const file = node(NodeKind.File, "Readme.md", null)
    const child = node(NodeKind.File, "Today.md", folder.id)

    const tree = buildTree([file, child, folder])

    expect(tree.map((item) => item.name)).toEqual(["Notes", "Readme.md"])
    expect(tree[0]?.children.map((item) => item.name)).toEqual(["Today.md"])
  })

  it("orders siblings by latest edit time when requested", () => {
    const oldFolder = touch(node(NodeKind.Folder, "Archive", null), 2)
    const newFolder = touch(node(NodeKind.Folder, "Notes", null), 4)
    const oldFile = touch(node(NodeKind.File, "Readme.md", null), 1)
    const newFile = touch(node(NodeKind.File, "Today.md", null), 3)

    const tree = buildTree([oldFile, newFile, oldFolder, newFolder], TreeSortOrder.Updated)

    expect(tree.map((item) => item.name)).toEqual(["Notes", "Archive", "Today.md", "Readme.md"])
  })

  it("returns the selected folder or parent folder as the create target", () => {
    const folder = node(NodeKind.Folder, "Notes", null)
    const file = node(NodeKind.File, "Today.md", folder.id)

    expect(getFolderTarget([folder, file], folder.id)).toBe(folder.id)
    expect(getFolderTarget([folder, file], file.id)).toBe(folder.id)
  })

  it("creates stable duplicate names next to existing files", () => {
    const first = node(NodeKind.File, "Untitled.md", null)
    const second = node(NodeKind.File, "Untitled 2.md", null)

    expect(uniqueName([first, second], null, "Untitled.md")).toBe("Untitled 3.md")
  })

  it("moves multiple selected root files into the same folder", () => {
    const folder = node(NodeKind.Folder, "Notes", null)
    const first = node(NodeKind.File, "Today.md", null)
    const second = node(NodeKind.File, "Tomorrow.md", null)

    const result = moveNodesToParent({
      nodes: [folder, first, second],
      selectedIds: [first.id, second.id],
      parentId: folder.id,
      updatedAt: 10,
    })

    expect(result.kind).toBe("moved")
    if (result.kind !== "moved") {
      throw new Error("Expected nodes to move.")
    }
    expect(result.nodes).toEqual([
      folder,
      { ...first, parentId: folder.id, updatedAt: 10 },
      { ...second, parentId: folder.id, updatedAt: 10 },
    ])
  })

  it("moves only the top selected folder when its child is also selected", () => {
    const folder = node(NodeKind.Folder, "Notes", null)
    const child = node(NodeKind.File, "Today.md", folder.id)
    const target = node(NodeKind.Folder, "Archive", null)

    const result = moveNodesToParent({
      nodes: [folder, child, target],
      selectedIds: [folder.id, child.id],
      parentId: target.id,
      updatedAt: 10,
    })

    expect(result.kind).toBe("moved")
    if (result.kind !== "moved") {
      throw new Error("Expected parent selection to move.")
    }
    expect(result.nodes).toEqual([{ ...folder, parentId: target.id, updatedAt: 10 }, child, target])
  })

  it("rejects moving a selected folder into one of its descendants", () => {
    const folder = node(NodeKind.Folder, "Notes", null)
    const childFolder = node(NodeKind.Folder, "Drafts", folder.id)

    const result = moveNodesToParent({
      nodes: [folder, childFolder],
      selectedIds: [folder.id],
      parentId: childFolder.id,
      updatedAt: 10,
    })

    expect(result.kind).toBe("invalid")
    if (result.kind !== "invalid") {
      throw new Error("Expected descendant target to be rejected.")
    }
    expect(result.message).toBe("Cannot move into itself.")
  })
})
