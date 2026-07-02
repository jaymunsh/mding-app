export type StoredZipEntry = {
  readonly path: string
  readonly content: Uint8Array
}

type CentralDirectoryRecord = {
  readonly pathBytes: Uint8Array
  readonly crc: number
  readonly size: number
  readonly localHeaderOffset: number
  readonly modTime: number
  readonly modDate: number
}

const localFileHeaderSignature = 0x04034b50
const centralDirectoryHeaderSignature = 0x02014b50
const endOfCentralDirectorySignature = 0x06054b50
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export function createStoredZipBlob(entries: readonly StoredZipEntry[]): Blob {
  const localParts: Uint8Array[] = []
  const centralRecords: CentralDirectoryRecord[] = []
  let offset = 0

  for (const entry of entries) {
    const pathBytes = textEncoder.encode(normalizeZipPath(entry.path))
    const crc = crc32(entry.content)
    const modTime = dosTime(new Date())
    const modDate = dosDate(new Date())
    const localHeader = createLocalFileHeader({
      pathBytes,
      crc,
      size: entry.content.length,
      modTime,
      modDate,
    })

    localParts.push(localHeader, entry.content)
    centralRecords.push({
      pathBytes,
      crc,
      size: entry.content.length,
      localHeaderOffset: offset,
      modTime,
      modDate,
    })
    offset += localHeader.length + entry.content.length
  }

  const centralDirectoryParts = centralRecords.map(createCentralDirectoryHeader)
  const centralDirectorySize = centralDirectoryParts.reduce((total, part) => total + part.length, 0)
  const endOfCentralDirectory = createEndOfCentralDirectory({
    entryCount: centralRecords.length,
    centralDirectorySize,
    centralDirectoryOffset: offset,
  })

  const zipBytes = concatUint8Arrays([
    ...localParts,
    ...centralDirectoryParts,
    endOfCentralDirectory,
  ])
  return new Blob([toArrayBuffer(zipBytes)], { type: "application/zip" })
}

export function readStoredZipEntries(buffer: ArrayBuffer): readonly StoredZipEntry[] {
  const bytes = new Uint8Array(buffer)
  const view = new DataView(buffer)
  const entries: StoredZipEntry[] = []
  let offset = 0

  while (offset + 4 <= bytes.length) {
    const signature = view.getUint32(offset, true)
    if (
      signature === centralDirectoryHeaderSignature ||
      signature === endOfCentralDirectorySignature
    ) {
      break
    }
    if (signature !== localFileHeaderSignature) {
      throw new Error("Unsupported zip backup format.")
    }

    ensureAvailable(bytes, offset, 30)
    const flags = view.getUint16(offset + 6, true)
    const compressionMethod = view.getUint16(offset + 8, true)
    const compressedSize = view.getUint32(offset + 18, true)
    const nameLength = view.getUint16(offset + 26, true)
    const extraLength = view.getUint16(offset + 28, true)
    const nameStart = offset + 30
    const contentStart = nameStart + nameLength + extraLength
    const contentEnd = contentStart + compressedSize

    if ((flags & 0x08) !== 0 || compressionMethod !== 0) {
      throw new Error("Only stored mding zip backups are supported.")
    }

    ensureAvailable(bytes, nameStart, nameLength)
    ensureAvailable(bytes, contentStart, compressedSize)
    entries.push({
      path: textDecoder.decode(bytes.slice(nameStart, nameStart + nameLength)),
      content: bytes.slice(contentStart, contentEnd),
    })
    offset = contentEnd
  }

  return entries
}

export function readStoredZipEntryNames(buffer: ArrayBuffer): readonly string[] {
  return readStoredZipEntries(buffer).map((entry) => entry.path)
}

function createLocalFileHeader(record: {
  readonly pathBytes: Uint8Array
  readonly crc: number
  readonly size: number
  readonly modTime: number
  readonly modDate: number
}): Uint8Array {
  const header = new Uint8Array(30 + record.pathBytes.length)
  const view = new DataView(header.buffer)
  view.setUint32(0, localFileHeaderSignature, true)
  view.setUint16(4, 20, true)
  view.setUint16(6, 0, true)
  view.setUint16(8, 0, true)
  view.setUint16(10, record.modTime, true)
  view.setUint16(12, record.modDate, true)
  view.setUint32(14, record.crc, true)
  view.setUint32(18, record.size, true)
  view.setUint32(22, record.size, true)
  view.setUint16(26, record.pathBytes.length, true)
  view.setUint16(28, 0, true)
  header.set(record.pathBytes, 30)
  return header
}

function createCentralDirectoryHeader(record: CentralDirectoryRecord): Uint8Array {
  const header = new Uint8Array(46 + record.pathBytes.length)
  const view = new DataView(header.buffer)
  view.setUint32(0, centralDirectoryHeaderSignature, true)
  view.setUint16(4, 20, true)
  view.setUint16(6, 20, true)
  view.setUint16(8, 0, true)
  view.setUint16(10, 0, true)
  view.setUint16(12, record.modTime, true)
  view.setUint16(14, record.modDate, true)
  view.setUint32(16, record.crc, true)
  view.setUint32(20, record.size, true)
  view.setUint32(24, record.size, true)
  view.setUint16(28, record.pathBytes.length, true)
  view.setUint16(30, 0, true)
  view.setUint16(32, 0, true)
  view.setUint16(34, 0, true)
  view.setUint16(36, 0, true)
  view.setUint32(38, 0, true)
  view.setUint32(42, record.localHeaderOffset, true)
  header.set(record.pathBytes, 46)
  return header
}

function createEndOfCentralDirectory(record: {
  readonly entryCount: number
  readonly centralDirectorySize: number
  readonly centralDirectoryOffset: number
}): Uint8Array {
  const header = new Uint8Array(22)
  const view = new DataView(header.buffer)
  view.setUint32(0, endOfCentralDirectorySignature, true)
  view.setUint16(4, 0, true)
  view.setUint16(6, 0, true)
  view.setUint16(8, record.entryCount, true)
  view.setUint16(10, record.entryCount, true)
  view.setUint32(12, record.centralDirectorySize, true)
  view.setUint32(16, record.centralDirectoryOffset, true)
  view.setUint16(20, 0, true)
  return header
}

function crc32(content: Uint8Array): number {
  let crc = -1
  for (const byte of content) {
    let value = (crc ^ byte) & 0xff
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1 ? (value >>> 1) ^ 0xedb88320 : value >>> 1
    }
    crc = (crc >>> 8) ^ value
  }
  return (crc ^ -1) >>> 0
}

function normalizeZipPath(path: string): string {
  return path.replace(/^\/+/, "").replace(/\\/g, "/")
}

function ensureAvailable(bytes: Uint8Array, start: number, length: number): void {
  if (start < 0 || length < 0 || start + length > bytes.length) {
    throw new Error("Invalid zip backup.")
  }
}

function concatUint8Arrays(chunks: readonly Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((total, chunk) => total + chunk.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0

  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }

  return result
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return buffer
}

function dosTime(date: Date): number {
  return (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)
}

function dosDate(date: Date): number {
  const year = Math.max(date.getFullYear(), 1980)
  return ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
}
