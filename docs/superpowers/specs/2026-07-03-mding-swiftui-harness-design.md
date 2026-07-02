# mding SwiftUI Harness Design

## Goal

Build a lightweight personal Markdown editor/viewer harness for iOS, iPadOS, and macOS with a shared SwiftUI codebase.

## Product Shape

mding manages one app-owned workspace. The user creates folders and Markdown files inside the app, selects a file to preview rendered Markdown, and toggles into plain-text editing from the top toolbar. The first version does not expose the storage location in Finder or Files as the main workflow. Import/export and iCloud Drive workspaces remain later extensions.

## Platform Behavior

The app uses shared SwiftUI views and platform-adaptive navigation.

- On iPhone or compact widths, navigation collapses into list-to-detail pushes.
- On iPad and macOS, the app presents a split layout with the workspace browser on the left and preview/editor content on the right.
- `NavigationSplitView` is the default shell because it can adapt between split and collapsed navigation.

## Storage

The workspace lives under the app's Application Support directory:

`Application Support/mding/workspace`

The harness creates this directory on first launch and seeds a small welcome Markdown file when the workspace is empty. File operations are scoped to this root:

- Create folder
- Create Markdown file
- Rename
- Delete
- Move within the workspace
- Read/write Markdown text

Paths are represented as relative paths from the workspace root so UI state is stable across launches and platform-specific sandbox roots stay hidden.

## UI Components

- `WorkspaceStore`: Observable state for the file tree, selection, editing mode, and file operations.
- `FileSystemWorkspace`: FileManager-backed workspace implementation.
- `FileNode`: Tree model for files and folders.
- `WorkspaceBrowserView`: Tree/list view for folder and file selection.
- `MarkdownDocumentView`: Detail area that switches between rendered Markdown preview and text editing.
- `RootView`: Adaptive shell using `NavigationSplitView`.

## Markdown Rendering

The first harness uses SwiftUI's built-in Markdown-capable `Text(.init(markdown))` rendering. This keeps dependencies at zero. Advanced tables, custom code highlighting, and GitHub-flavored extensions are out of scope for the harness.

## Error Handling

File operation errors are surfaced in app state as a short message suitable for alerts. The store refreshes the workspace after successful writes and preserves selection when possible.

## Testing and Verification

The harness should compile with SwiftPM for the shared code path. Full iOS/macOS app bundle builds require Xcode to be installed and selected as the active developer directory. In this environment, only Command Line Tools are active, so verification uses `swift build` and records the Xcode limitation.

## Out of Scope

- iCloud Drive workspace selection
- Finder/Files storage browsing as the primary workflow
- TestFlight automation
- Rich Markdown extensions
- Sync conflict handling
- Multiple workspaces
