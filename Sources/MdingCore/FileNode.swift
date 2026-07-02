import Foundation

public struct FileNode: Identifiable, Hashable, Sendable {
    public let name: String
    public let relativePath: String
    public let isDirectory: Bool
    public var children: [FileNode]?

    public var id: String {
        relativePath.isEmpty ? "/" : relativePath
    }

    public init(
        name: String,
        relativePath: String,
        isDirectory: Bool,
        children: [FileNode]? = nil
    ) {
        self.name = name
        self.relativePath = relativePath
        self.isDirectory = isDirectory
        self.children = children
    }
}

