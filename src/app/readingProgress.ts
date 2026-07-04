import { z } from "zod"

const readingProgressStorageKey = "mding.readingProgress.v1"
const minimumVisibleRatio = 0.005
const ReadingProgressMapSchema = z.record(z.string(), z.number().min(0).max(1))

export type ReadingProgressMap = Readonly<Record<string, number>>

export function readReadingProgress(): ReadingProgressMap {
  try {
    const stored = localStorage.getItem(readingProgressStorageKey)
    if (stored === null) {
      return {}
    }
    return ReadingProgressMapSchema.parse(JSON.parse(stored))
  } catch (error) {
    if (error instanceof Error) {
      return {}
    }
    return {}
  }
}

export function writeReadingProgress(progress: ReadingProgressMap): void {
  try {
    localStorage.setItem(readingProgressStorageKey, JSON.stringify(progress))
  } catch (error) {
    if (error instanceof Error) {
      return
    }
  }
}

export function updateReadingProgress(
  progress: ReadingProgressMap,
  documentId: string,
  ratio: number,
): ReadingProgressMap {
  const normalizedRatio = normalizeReadingProgressRatio(ratio)
  if (normalizedRatio === 0) {
    return Object.fromEntries(Object.entries(progress).filter(([key]) => key !== documentId))
  }
  return {
    ...progress,
    [documentId]: normalizedRatio,
  }
}

export function formatReadingProgressPercent(ratio: number | undefined): string | null {
  if (ratio === undefined || ratio < minimumVisibleRatio) {
    return null
  }
  if (ratio >= 0.995) {
    return "100%"
  }
  return `${Math.max(1, Math.round(ratio * 100))}%`
}

function normalizeReadingProgressRatio(ratio: number): number {
  if (!Number.isFinite(ratio) || ratio < minimumVisibleRatio) {
    return 0
  }
  if (ratio > 1) {
    return 1
  }
  return ratio
}
