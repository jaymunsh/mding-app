import { messageFromError } from "./workspaceState"

type LaunchParams = {
  readonly files: readonly FileSystemFileHandle[]
}

type LaunchQueue = {
  readonly setConsumer: (consumer: (params: LaunchParams) => void) => void
}

declare global {
  interface Window {
    readonly launchQueue?: LaunchQueue
  }
}

type DocumentLaunchHandler = {
  readonly openFiles: (files: readonly File[]) => Promise<void>
  readonly reportError: (message: string) => void
}

export function registerDocumentLaunchHandler(handler: DocumentLaunchHandler): boolean {
  const launchQueue = window.launchQueue
  if (launchQueue === undefined) {
    return false
  }

  launchQueue.setConsumer((launchParams) => {
    void openLaunchedFiles(launchParams.files, handler)
  })
  return true
}

async function openLaunchedFiles(
  handles: readonly FileSystemFileHandle[],
  handler: DocumentLaunchHandler,
): Promise<void> {
  try {
    const files = await Promise.all(handles.map((handle) => handle.getFile()))
    await handler.openFiles(files)
  } catch (error) {
    handler.reportError(messageFromError(error))
  }
}
