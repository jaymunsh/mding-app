import { describe, expect, it } from "vitest"
import { buildTree, getFolderTarget, uniqueName } from "./tree"
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

describe("workspace tree", () => {
  it("orders folders before files and nests children when building the tree", () => {
    const folder = node(NodeKind.Folder, "Notes", null)
    const file = node(NodeKind.File, "Readme.md", null)
    const child = node(NodeKind.File, "Today.md", folder.id)

    const tree = buildTree([file, child, folder])

    expect(tree.map((item) => item.name)).toEqual(["Notes", "Readme.md"])
    expect(tree[0]?.children.map((item) => item.name)).toEqual(["Today.md"])
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
