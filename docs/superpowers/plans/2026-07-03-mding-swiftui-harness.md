# mding SwiftUI Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a SwiftPM-backed SwiftUI harness for a lightweight Markdown workspace editor/viewer.

**Architecture:** The package has a testable `MdingCore` library for file tree models, workspace file operations, and observable app state. The `MdingApp` executable target owns SwiftUI views and adapts through `NavigationSplitView`, which collapses on compact devices and shows split layout on wider iPad/macOS contexts.

**Tech Stack:** Swift 6.3, SwiftUI, Foundation `FileManager`, Swift Testing, Swift Package Manager.

---

## File Structure

- Create `Package.swift`: SwiftPM manifest with `MdingCore`, `MdingApp`, and `MdingCoreTests`.
- Create `Sources/MdingCore/FileNode.swift`: relative-path tree node model.
- Create `Sources/MdingCore/FileSystemWorkspace.swift`: workspace root, scan, create, rename, move, delete, read, and write operations.
- Create `Sources/MdingCore/WorkspaceStore.swift`: `@MainActor ObservableObject` state for tree, selection, edit mode, and user-facing errors.
- Create `Sources/MdingApp/MdingApp.swift`: app entry point.
- Create `Sources/MdingApp/RootView.swift`: adaptive navigation shell.
- Create `Sources/MdingApp/WorkspaceBrowserView.swift`: recursive browser with create/delete/rename/move commands.
- Create `Sources/MdingApp/MarkdownDocumentView.swift`: preview/edit toggle and save flow.
- Create `Tests/MdingCoreTests/FileSystemWorkspaceTests.swift`: filesystem behavior tests in a temporary directory.

### Task 1: SwiftPM Package Skeleton

**Files:**
- Create: `Package.swift`
- Create: `Sources/MdingCore/FileNode.swift`
- Create: `Sources/MdingApp/MdingApp.swift`

- [ ] **Step 1: Add package manifest**

```swift
// swift-tools-version: 6.3
import PackageDescription

let package = Package(
    name: "mding",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(name: "MdingCore", targets: ["MdingCore"]),
        .executable(name: "MdingApp", targets: ["MdingApp"])
    ],
    targets: [
        .target(name: "MdingCore"),
        .executableTarget(name: "MdingApp", dependencies: ["MdingCore"]),
        .testTarget(name: "MdingCoreTests", dependencies: ["MdingCore"])
    ],
    swiftLanguageModes: [.v6]
)
```

- [ ] **Step 2: Add minimal model and app entry**

```swift
public struct FileNode: Identifiable, Hashable, Sendable {
    public let id: String
    public let name: String
    public let relativePath: String
    public let isDirectory: Bool
    public var children: [FileNode]?
}
```

```swift
import SwiftUI

@main
struct MdingApp: App {
    var body: some Scene {
        WindowGroup {
            Text("mding")
        }
    }
}
```

- [ ] **Step 3: Verify skeleton compile**

Run: `swift build`

Expected: exit code 0.

### Task 2: FileSystemWorkspace

**Files:**
- Create: `Sources/MdingCore/FileSystemWorkspace.swift`
- Create: `Tests/MdingCoreTests/FileSystemWorkspaceTests.swift`

- [ ] **Step 1: Add tests for workspace file operations**

```swift
import Foundation
import Testing
@testable import MdingCore

@Test func workspaceCreatesReadsWritesRenamesMovesAndDeletesMarkdownFiles() throws {
    let root = FileManager.default.temporaryDirectory.appending(path: UUID().uuidString)
    defer { try? FileManager.default.removeItem(at: root) }

    let workspace = FileSystemWorkspace(rootURL: root)
    try workspace.bootstrap()
    try workspace.createFolder(named: "Notes", in: "")
    try workspace.createMarkdownFile(named: "First.md", in: "Notes")
    try workspace.writeMarkdown("# Hello", to: "Notes/First.md")

    #expect(try workspace.readMarkdown(at: "Notes/First.md") == "# Hello")

    try workspace.renameItem(at: "Notes/First.md", to: "Second.md")
    try workspace.moveItem(at: "Notes/Second.md", toFolder: "")
    try workspace.deleteItem(at: "Second.md")

    let nodes = try workspace.loadTree()
    #expect(nodes.contains { $0.name == "Notes" })
    #expect(!nodes.contains { $0.name == "Second.md" })
}
```

- [ ] **Step 2: Implement workspace operations**

Implement a `FileSystemWorkspace` that resolves all relative paths under the workspace root and rejects path traversal by checking standardized URLs.

- [ ] **Step 3: Verify tests**

Run: `swift test`

Expected: exit code 0.

### Task 3: Workspace Store

**Files:**
- Create: `Sources/MdingCore/WorkspaceStore.swift`
- Modify: `Tests/MdingCoreTests/FileSystemWorkspaceTests.swift`

- [ ] **Step 1: Add store behavior test**

```swift
@Test @MainActor func storeSelectsAndSavesMarkdownFiles() throws {
    let root = FileManager.default.temporaryDirectory.appending(path: UUID().uuidString)
    defer { try? FileManager.default.removeItem(at: root) }

    let workspace = FileSystemWorkspace(rootURL: root)
    let store = WorkspaceStore(workspace: workspace)
    store.bootstrap()
    store.createMarkdownFile()
    store.select(path: "Untitled.md")
    store.editBuffer = "Body"
    store.saveSelectedFile()

    #expect(try workspace.readMarkdown(at: "Untitled.md") == "Body")
}
```

- [ ] **Step 2: Implement observable store**

Implement `WorkspaceStore` with published `nodes`, `selectedPath`, `selectedText`, `editBuffer`, `isEditing`, and `errorMessage`, plus methods that wrap workspace operations and refresh the tree.

- [ ] **Step 3: Verify tests**

Run: `swift test`

Expected: exit code 0.

### Task 4: SwiftUI Views

**Files:**
- Modify: `Sources/MdingApp/MdingApp.swift`
- Create: `Sources/MdingApp/RootView.swift`
- Create: `Sources/MdingApp/WorkspaceBrowserView.swift`
- Create: `Sources/MdingApp/MarkdownDocumentView.swift`

- [ ] **Step 1: Replace placeholder app with RootView**

Create a `@StateObject` store backed by `FileSystemWorkspace.defaultWorkspace()` and call `store.bootstrap()` on appear.

- [ ] **Step 2: Add adaptive navigation**

Use `NavigationSplitView` with `WorkspaceBrowserView` as the sidebar and `MarkdownDocumentView` as the detail view.

- [ ] **Step 3: Add browser commands**

Expose toolbar/context actions for new file, new folder, rename, delete, and move-to-root.

- [ ] **Step 4: Add editor/preview detail**

Render Markdown with `AttributedString(markdown:)`, use `TextEditor` for editing, and provide toolbar buttons for edit/save/cancel.

- [ ] **Step 5: Verify app compile**

Run: `swift build`

Expected: exit code 0.

### Task 5: Manual QA Notes

**Files:**
- Create: `docs/verification/2026-07-03-mding-harness.md`

- [ ] **Step 1: Record verification**

Document the `swift test`, `swift build`, and current `xcodebuild -version` result.

- [ ] **Step 2: Commit implementation**

Run:

```bash
git add Package.swift Sources Tests docs
git commit -m "feat: add SwiftUI mding harness"
```

Expected: commit succeeds.

## Self-Review

- Spec coverage: The plan covers app-owned storage, adaptive navigation, Markdown preview/edit, file create/delete/rename/move, and SwiftPM verification.
- Placeholder scan: No implementation step depends on an undefined later component.
- Type consistency: `FileNode`, `FileSystemWorkspace`, and `WorkspaceStore` names are consistent across tasks.
