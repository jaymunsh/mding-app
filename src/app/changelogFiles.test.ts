import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import { APP_VERSION } from "./appVersion"

const changelogPaths = ["CHANGELOG.md", "CHANGELOG.ko.md"] as const

describe("changelog files", () => {
  it("starts both language versions with the current app version", async () => {
    const changelogs = await Promise.all(changelogPaths.map((path) => readFile(path, "utf8")))

    for (const changelog of changelogs) {
      expect(releaseVersions(changelog)[0]).toBe(APP_VERSION)
    }
  })

  it("keeps the English and Korean release versions in sync", async () => {
    const english = await readFile(changelogPaths[0], "utf8")
    const korean = await readFile(changelogPaths[1], "utf8")

    expect(releaseVersions(english)).toEqual(releaseVersions(korean))
  })
})

function releaseVersions(changelog: string): readonly string[] {
  const versions: string[] = []
  for (const match of changelog.matchAll(/^## (\d+\.\d+\.\d+) - /gm)) {
    const version = match[1]
    if (version !== undefined) {
      versions.push(`v${version}`)
    }
  }
  return versions
}
