import { describe, expect, it } from "vitest"
import { APP_VERSION } from "./appVersion"
import { currentReleaseNote } from "./releaseNotes"

describe("current Korean release note", () => {
  it("uses concise v1.6.1 copy for the update history dialog", () => {
    expect(currentReleaseNote("ko")).toEqual({
      version: APP_VERSION,
      date: "2026-07-18",
      summary: "더 안전한 삭제와 선명한 고정 영역으로 작업공간을 다듬었습니다.",
      highlights: [
        "선택 항목과 전체 작업공간을 삭제하기 전에 확인합니다.",
        "기존 실행 취소 기능으로 삭제한 항목을 5초 동안 복구할 수 있습니다.",
        "더 진한 배경과 구분선으로 고정 영역을 명확하게 표시합니다.",
      ],
    })
  })
})
