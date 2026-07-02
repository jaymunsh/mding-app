import MdingCore
import SwiftUI

struct MarkdownDocumentView: View {
    @ObservedObject var store: WorkspaceStore

    var body: some View {
        Group {
            if store.selectedPath == nil {
                ContentUnavailableView("Select a Markdown file", systemImage: "doc.text.magnifyingglass")
            } else if store.isEditing {
                TextEditor(text: $store.editBuffer)
                    .font(.system(.body, design: .monospaced))
                    .padding(8)
            } else {
                ScrollView {
                    Text(renderedMarkdown)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                }
            }
        }
        .navigationTitle(selectedTitle)
        .toolbar {
            ToolbarItemGroup {
                if store.selectedPath != nil {
                    if store.isEditing {
                        Button {
                            store.cancelEditing()
                        } label: {
                            Label("Cancel", systemImage: "xmark")
                        }

                        Button {
                            store.saveSelectedFile()
                        } label: {
                            Label("Save", systemImage: "checkmark")
                        }
                    } else {
                        Button {
                            store.startEditing()
                        } label: {
                            Label("Edit", systemImage: "square.and.pencil")
                        }
                    }
                }
            }
        }
    }

    private var renderedMarkdown: AttributedString {
        (try? AttributedString(markdown: store.selectedText))
            ?? AttributedString(store.selectedText)
    }

    private var selectedTitle: String {
        guard let path = store.selectedPath else {
            return "Preview"
        }
        return path.split(separator: "/").last.map(String.init) ?? path
    }
}

