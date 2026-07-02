import Combine
import Foundation

@MainActor
public final class WorkspaceStore: ObservableObject {
    @Published public private(set) var nodes: [FileNode] = []
    @Published public var selectedPath: String?
    @Published public private(set) var selectedText = ""
    @Published public var editBuffer = ""
    @Published public var isEditing = false
    @Published public var errorMessage: String?

    public let workspace: FileSystemWorkspace

    public init(workspace: FileSystemWorkspace) {
        self.workspace = workspace
    }

    public func bootstrap() {
        perform {
            try workspace.bootstrap()
            try refreshKeepingSelection()
        }
    }

    public func refresh() {
        perform {
            try refreshKeepingSelection()
        }
    }

    public func select(path: String?) {
        selectedPath = path
        isEditing = false
        selectedText = ""
        editBuffer = ""

        guard let path,
              let node = node(at: path),
              !node.isDirectory else {
            return
        }

        perform {
            selectedText = try workspace.readMarkdown(at: path)
            editBuffer = selectedText
        }
    }

    @discardableResult
    public func createMarkdownFile(named name: String = "Untitled.md") -> String? {
        performReturning {
            let path = try workspace.createMarkdownFile(named: name, in: targetFolderPath())
            try refreshKeepingSelection()
            select(path: path)
            isEditing = true
            return path
        }
    }

    @discardableResult
    public func createFolder(named name: String = "Folder") -> String? {
        performReturning {
            let path = try workspace.createFolder(named: name, in: targetFolderPath())
            try refreshKeepingSelection()
            select(path: path)
            return path
        }
    }

    public func renameSelected(to name: String) {
        guard let selectedPath else {
            errorMessage = WorkspaceError.selectedItemMissing.localizedDescription
            return
        }

        perform {
            let parent = parentPath(of: selectedPath)
            let newName = name.trimmingCharacters(in: .whitespacesAndNewlines)
            try workspace.renameItem(at: selectedPath, to: newName)
            let newPath = parent.isEmpty ? newName : parent + "/" + newName
            try refreshKeepingSelection()
            select(path: normalizedMarkdownPath(newPath, originalPath: selectedPath))
        }
    }

    public func deleteSelected() {
        guard let selectedPath else {
            errorMessage = WorkspaceError.selectedItemMissing.localizedDescription
            return
        }

        perform {
            try workspace.deleteItem(at: selectedPath)
            self.selectedPath = nil
            self.selectedText = ""
            self.editBuffer = ""
            self.isEditing = false
            try refreshKeepingSelection()
        }
    }

    public func moveSelectedToRoot() {
        guard let selectedPath else {
            errorMessage = WorkspaceError.selectedItemMissing.localizedDescription
            return
        }

        perform {
            let leafName = selectedPath.split(separator: "/").last.map(String.init) ?? selectedPath
            try workspace.moveItem(at: selectedPath, toFolder: "")
            try refreshKeepingSelection()
            select(path: leafName)
        }
    }

    public func startEditing() {
        editBuffer = selectedText
        isEditing = true
    }

    public func cancelEditing() {
        editBuffer = selectedText
        isEditing = false
    }

    public func saveSelectedFile() {
        guard let selectedPath else {
            errorMessage = WorkspaceError.selectedItemMissing.localizedDescription
            return
        }

        perform {
            try workspace.writeMarkdown(editBuffer, to: selectedPath)
            selectedText = editBuffer
            isEditing = false
            try refreshKeepingSelection()
        }
    }

    public func node(at path: String) -> FileNode? {
        node(at: path, in: nodes)
    }
}

private extension WorkspaceStore {
    func perform(_ operation: () throws -> Void) {
        do {
            try operation()
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func performReturning<T>(_ operation: () throws -> T) -> T? {
        do {
            let value = try operation()
            errorMessage = nil
            return value
        } catch {
            errorMessage = error.localizedDescription
            return nil
        }
    }

    func refreshKeepingSelection() throws {
        nodes = try workspace.loadTree()
        if let selectedPath, node(at: selectedPath) == nil {
            self.selectedPath = nil
            selectedText = ""
            editBuffer = ""
            isEditing = false
        }
    }

    func targetFolderPath() -> String {
        guard let selectedPath,
              let selectedNode = node(at: selectedPath) else {
            return ""
        }
        return selectedNode.isDirectory ? selectedNode.relativePath : parentPath(of: selectedPath)
    }

    func parentPath(of path: String) -> String {
        let components = path.split(separator: "/")
        guard components.count > 1 else {
            return ""
        }
        return components.dropLast().joined(separator: "/")
    }

    func normalizedMarkdownPath(_ path: String, originalPath: String) -> String {
        let originalExtension = URL(fileURLWithPath: originalPath).pathExtension
        let renamedExtension = URL(fileURLWithPath: path).pathExtension

        if !originalExtension.isEmpty && renamedExtension.isEmpty {
            return path + "." + originalExtension
        }
        return path
    }

    func node(at path: String, in nodes: [FileNode]) -> FileNode? {
        for node in nodes {
            if node.relativePath == path {
                return node
            }
            if let children = node.children,
               let child = self.node(at: path, in: children) {
                return child
            }
        }
        return nil
    }
}

