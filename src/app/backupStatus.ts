import { z } from "zod"

const backupTimestampKey = "mding.lastBackupAt"
const BackupTimestampSchema = z.coerce.number().int().positive()

export function readLastBackupAt(): number | null {
  return BackupTimestampSchema.nullable()
    .catch(null)
    .parse(localStorage.getItem(backupTimestampKey))
}

export function writeLastBackupAt(timestamp: number): void {
  localStorage.setItem(backupTimestampKey, String(timestamp))
}
