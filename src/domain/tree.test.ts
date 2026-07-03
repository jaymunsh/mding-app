import { describe, expect, it } from "vitest"
import { buildTree, getFolderTarget, TreeSortOrder, uniqueName } from "./tree"
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
})
