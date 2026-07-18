// @vitest-environment happy-dom

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createNodeId, NodeKind, type WorkspaceNode } from "../domain/workspace"
import type { WorkspaceRepository } from "../storage/workspaceRepository"
import {
  DELETION_UNDO_DURATION_MS,
  useWorkspaceController,
  type WorkspaceController,
} from "./workspaceController"

const mocks = vi.hoisted(() => ({
  repository: null as WorkspaceRepository | null,
}))

vi.mock("../storage/workspaceRepository", () => ({
  createWorkspaceRepository: () => {
    if (mocks.repository === null) {
      throw new Error("Missing test repository")
    }
    return mocks.repository
  },
}))

const roots: Root[] = []

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => root.unmount())
  }
  document.body.replaceChildren()
  mocks.repository = null
})

describe("workspace controller mutation outcomes", () => {
  it("keeps deleted items available for undo for five seconds", () => {
    expect(DELETION_UNDO_DURATION_MS).toBe(5_000)
  })

  it("returns an error outcome without changing the selected workspace when creation rejects", async () => {
    // Given
    const selectedFolder = folder("Notes")
    mocks.repository = rejectingCreateRepository([selectedFolder])
    const getController = renderController()

    await act(async () => {
      await Promise.resolve()
    })
    await act(async () => {
      await getController().selectNode(selectedFolder.id)
    })

    // When
    let outcome: Awaited<ReturnType<WorkspaceController["createFile"]>> | null = null
    await act(async () => {
      outcome = await getController().createFile("Draft")
    })

    // Then
    expect(outcome).toEqual({ kind: "error", message: "Storage unavailable" })
    expect(getController().nodes).toEqual([selectedFolder])
    expect(getController().selectedNode?.id).toBe(selectedFolder.id)
    expect(getController().errorMessage).toBe("Storage unavailable")
  })
})

function renderController(): () => WorkspaceController {
  const container = document.createElement("div")
  document.body.append(container)
  const root = createRoot(container)
  roots.push(root)
  let controller: WorkspaceController | null = null

  function TestController(): null {
    controller = useWorkspaceController()
    return null
  }

  act(() => root.render(<TestController />))
  if (controller === null) {
    throw new Error("Workspace controller did not render")
  }
  return () => {
    if (controller === null) {
      throw new Error("Workspace controller did not render")
    }
    return controller
  }
}

function folder(name: string): WorkspaceNode {
  return {
    id: createNodeId(),
    parentId: null,
    kind: NodeKind.Folder,
    name,
    createdAt: 1,
    updatedAt: 1,
  }
}

function rejectingCreateRepository(nodes: readonly WorkspaceNode[]): WorkspaceRepository {
  return {
    seedIfEmpty: async () => {},
    listNodes: async () => nodes,
    listDocuments: async () => [],
    getDocument: async () => null,
    createItem: async () => {
      throw new Error("Storage unavailable")
    },
    saveNode: async () => {},
    saveDocument: async () => {},
    deleteNode: async () => {},
    restoreSnapshot: async () => {},
    importSnapshot: async () => {},
  }
}
