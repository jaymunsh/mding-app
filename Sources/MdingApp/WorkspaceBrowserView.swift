import MdingCore
import SwiftUI

struct WorkspaceBrowserView: View {
    @ObservedObject var store: WorkspaceStore
    @State private var prompt: NamePrompt?

    var body: some View {
        List {
            if store.nodes.isEmpty {
                ContentUnavailableView("No Files", systemImage: "doc")
            } else {
                ForEach(store.nodes) { node in
                    FileNodeRow(node: node, store: store, prompt: $prompt)
                }
            }
        }
        .toolbar {
            ToolbarItemGroup {
                Button {
                    prompt = NamePrompt(title: "New Folder", value: "Folder", action: .newFolder)
                } label: {
                    Label("New Folder", systemImage: "folder.badge.plus")
                }

                Button {
                    prompt = NamePrompt(title: "New Markdown File", value: "Untitled.md", action: .newFile)
                } label: {
                    Label("New File", systemImage: "doc.badge.plus")
                }
            }
        }
        .sheet(item: $prompt) { prompt in
            NamePromptView(prompt: prompt) { value in
                apply(prompt.action, value: value)
            }
        }
    }

    private func apply(_ action: NamePrompt.Action, value: String) {
        switch action {
        case .newFile:
            store.createMarkdownFile(named: value)
        case .newFolder:
            store.createFolder(named: value)
        case .rename:
            store.renameSelected(to: value)
        }
    }
}

private struct FileNodeRow: View {
    let node: FileNode
    @ObservedObject var store: WorkspaceStore
    @Binding var prompt: NamePrompt?

    var body: some View {
        if node.isDirectory {
            DisclosureGroup {
                ForEach(node.children ?? []) { child in
                    FileNodeRow(node: child, store: store, prompt: $prompt)
                }
            } label: {
                rowLabel
            }
            .contextMenu {
                menuItems
            }
        } else {
            rowLabel
                .contextMenu {
                    menuItems
                }
        }
    }

    private var rowLabel: some View {
        Button {
            store.select(path: node.relativePath)
        } label: {
            Label(node.name, systemImage: node.isDirectory ? "folder" : "doc.text")
                .lineLimit(1)
        }
        .buttonStyle(.plain)
        .foregroundStyle(store.selectedPath == node.relativePath ? Color.accentColor : Color.primary)
    }

    @ViewBuilder
    private var menuItems: some View {
        Button("Rename") {
            store.select(path: node.relativePath)
            prompt = NamePrompt(title: "Rename", value: node.name, action: .rename)
        }

        Button("Move to Root") {
            store.select(path: node.relativePath)
            store.moveSelectedToRoot()
        }

        Button("Delete", role: .destructive) {
            store.select(path: node.relativePath)
            store.deleteSelected()
        }
    }
}

struct NamePrompt: Identifiable {
    enum Action {
        case newFile
        case newFolder
        case rename
    }

    let id = UUID()
    let title: String
    let value: String
    let action: Action
}

private struct NamePromptView: View {
    let prompt: NamePrompt
    let onSubmit: (String) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var value: String

    init(prompt: NamePrompt, onSubmit: @escaping (String) -> Void) {
        self.prompt = prompt
        self.onSubmit = onSubmit
        _value = State(initialValue: prompt.value)
    }

    var body: some View {
        NavigationStack {
            Form {
                TextField("Name", text: $value)
                    #if os(iOS)
                    .textInputAutocapitalization(.never)
                    #endif
            }
            .navigationTitle(prompt.title)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        onSubmit(value)
                        dismiss()
                    }
                }
            }
        }
        .frame(minWidth: 320, minHeight: 140)
    }
}
