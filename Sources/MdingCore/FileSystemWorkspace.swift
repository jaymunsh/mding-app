import Foundation

public enum WorkspaceError: Error, Equatable, LocalizedError, Sendable {
    case invalidName(String)
    case pathEscapesWorkspace(String)
    case rootCannotBeDeleted
    case targetAlreadyExists(String)
    case selectedItemMissing

    public var errorDescription: String? {
        switch self {
        case .invalidName(let name):
            return "Invalid file or folder name: \(name)"
        case .pathEscapesWorkspace(let path):
            return "Path is outside the workspace: \(path)"
        case .rootCannotBeDeleted:
            return "The workspace root cannot be deleted."
        case .targetAlreadyExists(let path):
            return "An item already exists at \(path)."
        case .selectedItemMissing:
            return "Select a file or folder first."
        }
    }
}

public struct FileSystemWorkspace: Sendable {
    public let rootURL: URL

    public init(rootURL: URL) {
        self.rootURL = rootURL
    }

    public static func defaultWorkspace() throws -> FileSystemWorkspace {
        let supportDirectory = try FileManager.default.url(
            for: .applicationSupportDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        )
        return FileSystemWorkspace(
            rootURL: supportDirectory
                .appendingPathComponent("mding", isDirectory: true)
                .appendingPathComponent("workspace", isDirectory: true)
        )
    }

    public func bootstrap() throws {
        try FileManager.default.createDirectory(
            at: rootURL,
            withIntermediateDirectories: true
        )

        let contents = try FileManager.default.contentsOfDirectory(
            at: rootURL,
            includingPropertiesForKeys: nil
        )

        if contents.isEmpty {
            let welcomePath = try createMarkdownFile(named: "Welcome.md", in: "")
            try writeMarkdown(
                """
                # Welcome to mding

                Create folders and Markdown files from the sidebar, then switch between preview and edit mode.
                """,
                to: welcomePath
            )
        }
    }

    public func loadTree() throws -> [FileNode] {
        try bootstrapIfNeeded()
        return try children(in: "", parentURL: rootURL)
    }

    @discardableResult
    public func createFolder(named rawName: String, in parentPath: String) throws -> String {
        let name = try validatedItemName(rawName, defaultExtension: nil)
        let parentURL = try url(for: parentPath)
        let relativePath = joined(parentPath, name)
        let destinationURL = try url(for: relativePath)

        try ensureDirectory(parentURL)
        try ensureMissing(destinationURL, relativePath: relativePath)
        try FileManager.default.createDirectory(
            at: destinationURL,
            withIntermediateDirectories: false
        )
        return relativePath
    }

    @discardableResult
    public func createMarkdownFile(named rawName: String, in parentPath: String) throws -> String {
        let name = try validatedItemName(rawName, defaultExtension: "md")
        let parentURL = try url(for: parentPath)
        let relativePath = joined(parentPath, name)
        let destinationURL = try url(for: relativePath)

        try ensureDirectory(parentURL)
        try ensureMissing(destinationURL, relativePath: relativePath)
        try Data().write(to: destinationURL, options: .atomic)
        return relativePath
    }

    public func readMarkdown(at relativePath: String) throws -> String {
        let fileURL = try url(for: relativePath)
        let data = try Data(contentsOf: fileURL)
        return String(decoding: data, as: UTF8.self)
    }

    public func writeMarkdown(_ text: String, to relativePath: String) throws {
        let fileURL = try url(for: relativePath)
        try Data(text.utf8).write(to: fileURL, options: .atomic)
    }

    public func renameItem(at relativePath: String, to rawName: String) throws {
        guard !relativePath.isEmpty else {
            throw WorkspaceError.rootCannotBeDeleted
        }

        let sourceURL = try url(for: relativePath)
        let isDirectory = try resourceIsDirectory(sourceURL)
        let name = try validatedItemName(
            rawName,
            defaultExtension: isDirectory ? nil : "md"
        )
        let parentPath = parentRelativePath(of: relativePath)
        let destinationPath = joined(parentPath, name)
        let destinationURL = try url(for: destinationPath)

        try ensureMissing(destinationURL, relativePath: destinationPath)
        try FileManager.default.moveItem(at: sourceURL, to: destinationURL)
    }

    public func moveItem(at relativePath: String, toFolder folderPath: String) throws {
        guard !relativePath.isEmpty else {
            throw WorkspaceError.rootCannotBeDeleted
        }

        let sourceURL = try url(for: relativePath)
        let folderURL = try url(for: folderPath)
        let destinationPath = joined(folderPath, sourceURL.lastPathComponent)
        let destinationURL = try url(for: destinationPath)

        try ensureDirectory(folderURL)
        if sourceURL.standardizedFileURL == destinationURL.standardizedFileURL {
            return
        }
        try ensureMissing(destinationURL, relativePath: destinationPath)
        try FileManager.default.moveItem(at: sourceURL, to: destinationURL)
    }

    public func deleteItem(at relativePath: String) throws {
        guard !relativePath.isEmpty else {
            throw WorkspaceError.rootCannotBeDeleted
        }

        try FileManager.default.removeItem(at: url(for: relativePath))
    }

    public func url(for relativePath: String) throws -> URL {
        let normalized = normalizedRelativePath(relativePath)
        let candidate = normalized.isEmpty
            ? rootURL
            : rootURL.appendingPathComponent(normalized)
        let root = rootURL.standardizedFileURL
        let resolved = candidate.standardizedFileURL
        let rootPrefix = root.path.hasSuffix("/") ? root.path : root.path + "/"

        if resolved.path != root.path && !resolved.path.hasPrefix(rootPrefix) {
            throw WorkspaceError.pathEscapesWorkspace(relativePath)
        }
        return resolved
    }
}

private extension FileSystemWorkspace {
    func bootstrapIfNeeded() throws {
        var isDirectory: ObjCBool = false
        if !FileManager.default.fileExists(atPath: rootURL.path, isDirectory: &isDirectory) {
            try bootstrap()
        } else if !isDirectory.boolValue {
            throw WorkspaceError.targetAlreadyExists(rootURL.path)
        }
    }

    func children(in parentPath: String, parentURL: URL) throws -> [FileNode] {
        let urls = try FileManager.default.contentsOfDirectory(
            at: parentURL,
            includingPropertiesForKeys: [.isDirectoryKey],
            options: [.skipsHiddenFiles]
        )

        return try urls
            .filter { url in
                let isDirectory = try resourceIsDirectory(url)
                return isDirectory || url.pathExtension.lowercased() == "md"
            }
            .sorted { left, right in
                let leftIsDirectory = (try? resourceIsDirectory(left)) ?? false
                let rightIsDirectory = (try? resourceIsDirectory(right)) ?? false

                if leftIsDirectory != rightIsDirectory {
                    return leftIsDirectory && !rightIsDirectory
                }
                return left.lastPathComponent.localizedStandardCompare(right.lastPathComponent) == .orderedAscending
            }
            .map { url in
                let isDirectory = try resourceIsDirectory(url)
                let relativePath = joined(parentPath, url.lastPathComponent)
                return FileNode(
                    name: url.lastPathComponent,
                    relativePath: relativePath,
                    isDirectory: isDirectory,
                    children: isDirectory ? try children(in: relativePath, parentURL: url) : nil
                )
            }
    }

    func ensureDirectory(_ url: URL) throws {
        var isDirectory: ObjCBool = false
        guard FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory),
              isDirectory.boolValue else {
            throw WorkspaceError.pathEscapesWorkspace(url.path)
        }
    }

    func ensureMissing(_ url: URL, relativePath: String) throws {
        if FileManager.default.fileExists(atPath: url.path) {
            throw WorkspaceError.targetAlreadyExists(relativePath)
        }
    }

    func resourceIsDirectory(_ url: URL) throws -> Bool {
        let values = try url.resourceValues(forKeys: [.isDirectoryKey])
        return values.isDirectory == true
    }

    func validatedItemName(_ rawName: String, defaultExtension: String?) throws -> String {
        let trimmed = rawName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty,
              !trimmed.contains("/"),
              !trimmed.contains(":"),
              !trimmed.contains("\0"),
              trimmed != ".",
              trimmed != ".." else {
            throw WorkspaceError.invalidName(rawName)
        }

        if let defaultExtension,
           URL(fileURLWithPath: trimmed).pathExtension.isEmpty {
            return trimmed + "." + defaultExtension
        }
        return trimmed
    }

    func normalizedRelativePath(_ relativePath: String) -> String {
        relativePath
            .split(separator: "/")
            .filter { !$0.isEmpty }
            .joined(separator: "/")
    }

    func joined(_ parentPath: String, _ childName: String) -> String {
        let parent = normalizedRelativePath(parentPath)
        return parent.isEmpty ? childName : parent + "/" + childName
    }

    func parentRelativePath(of relativePath: String) -> String {
        let components = normalizedRelativePath(relativePath).split(separator: "/")
        guard components.count > 1 else {
            return ""
        }
        return components.dropLast().joined(separator: "/")
    }
}
