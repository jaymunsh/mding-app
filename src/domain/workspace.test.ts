import { describe, expect, it } from "vitest"
import { createNodeId, NodeKind, type WorkspaceNode, WorkspaceNodeSchema } from "./workspace"

describe("workspace node parsing", () => {
  it("defaults an omitted file pin to false", () => {
    // Given
    const id = createNodeId()
    const legacyFile = {
      id,
      parentId: null,
      kind: NodeKind.File,
      name: "legacy.md",
      createdAt: 1,
      updatedAt: 1,
    }

    // When
    const parsedFile = WorkspaceNodeSchema.parse(legacyFile)

    // Then
    expect(parsedFile.kind).toBe(NodeKind.File)
    if (parsedFile.kind !== NodeKind.File) {
      throw new Error("Expected a parsed file node.")
    }
    expect(parsedFile.pinned).toBe(false)
  })

  it("does not add pin metadata to folders", () => {
    // Given
    const folder = {
      id: createNodeId(),
      parentId: null,
      kind: NodeKind.Folder,
      name: "Notes",
      createdAt: 1,
      updatedAt: 1,
    }

    // When
    const parsedFolder = WorkspaceNodeSchema.parse(folder)

    // Then
    expect("pinned" in parsedFolder).toBe(false)
  })

  it("rejects folder input that contains pin metadata", () => {
    // Given
    const folderWithPin = {
      id: createNodeId(),
      parentId: null,
      kind: NodeKind.Folder,
      name: "Notes",
      createdAt: 1,
      updatedAt: 1,
      pinned: true,
    }

    // When
    const result = WorkspaceNodeSchema.safeParse(folderWithPin)

    // Then
    expect(result.success).toBe(false)
  })

  it("does not expose pin metadata on folder nodes in TypeScript", () => {
    type FolderNode = Extract<WorkspaceNode, { kind: typeof NodeKind.Folder }>
    const folderDoesNotExposePinned: "pinned" extends keyof FolderNode ? false : true = true

    expect(folderDoesNotExposePinned).toBe(true)
  })
})
