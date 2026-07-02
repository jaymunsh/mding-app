import Foundation
import MdingCore

@main
@MainActor
struct MdingCoreSmokeTests {
    static func main() throws {
        try workspaceCreatesReadsWritesRenamesMovesAndDeletesMarkdownFiles()
        try storeSelectsAndSavesMarkdownFiles()
        try workspaceRejectsPathTraversal()
        print("MdingCoreSmokeTests passed")
    }

    private static func workspaceCreatesReadsWritesRenamesMovesAndDeletesMarkdownFiles() throws {
        let root = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: root) }

        let workspace = FileSystemWorkspace(rootURL: root)
        try workspace.bootstrap()
        try workspace.createFolder(named: "Notes", in: "")
        try workspace.createMarkdownFile(named: "First.md", in: "Notes")
        try workspace.writeMarkdown("# Hello", to: "Notes/First.md")

        try expect(try workspace.readMarkdown(at: "Notes/First.md") == "# Hello", "Markdown body should round-trip")

        try workspace.renameItem(at: "Notes/First.md", to: "Second.md")
        try workspace.moveItem(at: "Notes/Second.md", toFolder: "")
        try workspace.deleteItem(at: "Second.md")

        let nodes = try workspace.loadTree()
        try expect(nodes.contains { $0.name == "Notes" }, "Notes folder should remain after file move")
        try expect(!nodes.contains { $0.name == "Second.md" }, "Deleted file should not appear in root")
    }

    private static func storeSelectsAndSavesMarkdownFiles() throws {
        let root = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: root) }

        let workspace = FileSystemWorkspace(rootURL: root)
        let store = WorkspaceStore(workspace: workspace)
        store.bootstrap()
        store.createMarkdownFile()
        store.select(path: "Untitled.md")
        store.editBuffer = "Body"
        store.saveSelectedFile()

        try expect(try workspace.readMarkdown(at: "Untitled.md") == "Body", "Store save should write selected Markdown")
    }

    private static func workspaceRejectsPathTraversal() throws {
        let root = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: root) }

        let workspace = FileSystemWorkspace(rootURL: root)
        try workspace.bootstrap()

        do {
            _ = try workspace.url(for: "../outside.md")
            throw SmokeTestFailure("Path traversal should throw")
        } catch WorkspaceError.pathEscapesWorkspace("../outside.md") {
        }
    }

    private static func expect(_ condition: Bool, _ message: String) throws {
        if !condition {
            throw SmokeTestFailure(message)
        }
    }
}

struct SmokeTestFailure: Error, CustomStringConvertible {
    let description: String

    init(_ description: String) {
        self.description = description
    }
}
