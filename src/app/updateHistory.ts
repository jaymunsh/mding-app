export const LAST_SEEN_VERSION_STORAGE_KEY = "mding.lastSeenVersion"

type VersionStorage = Pick<Storage, "getItem" | "setItem">

export function readLastSeenVersion(
  storage: VersionStorage | null = resolveVersionStorage(),
): string | null {
  if (storage === null) {
    return null
  }

  try {
    const storedVersion = storage.getItem(LAST_SEEN_VERSION_STORAGE_KEY)?.trim()
    return storedVersion === undefined || storedVersion.length === 0 ? null : storedVersion
  } catch {
    return null
  }
}

export function isUpdateHistoryUnseen(
  currentVersion: string,
  storage: VersionStorage | null = resolveVersionStorage(),
): boolean {
  return readLastSeenVersion(storage) !== currentVersion
}

export function markUpdateHistorySeen(
  version: string,
  storage: VersionStorage | null = resolveVersionStorage(),
): void {
  if (storage === null) {
    return
  }

  try {
    storage.setItem(LAST_SEEN_VERSION_STORAGE_KEY, version)
  } catch {
    return
  }
}

function resolveVersionStorage(): VersionStorage | null {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}
