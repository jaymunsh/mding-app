import MdingCore
import SwiftUI

struct RootView: View {
    @StateObject private var store = WorkspaceStore(
        workspace: (try? FileSystemWorkspace.defaultWorkspace())
            ?? FileSystemWorkspace(rootURL: FileManager.default.temporaryDirectory.appendingPathComponent("mding-workspace"))
    )

    var body: some View {
        NavigationSplitView {
            WorkspaceBrowserView(store: store)
                .navigationTitle("mding")
        } detail: {
            MarkdownDocumentView(store: store)
        }
        .onAppear {
            store.bootstrap()
        }
        .alert(
            "Workspace Error",
            isPresented: Binding(
                get: { store.errorMessage != nil },
                set: { if !$0 { store.errorMessage = nil } }
            )
        ) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(store.errorMessage ?? "")
        }
    }
}

