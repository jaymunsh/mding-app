import { describe, expect, it } from "vitest"
import { APP_VERSION } from "./appVersion"
import { currentReleaseNote } from "./releaseNotes"

describe("current Korean release note", () => {
  it("uses concise v1.6.0 copy for the update history dialog", () => {
    expect(currentReleaseNote("ko")).toEqual({
      version: APP_VERSION,
      date: "2026-07-18",
      summary: "고정 바로가기와 집중 읽기를 더한 로컬 작업공간입니다.",
      highlights: [
        "Markdown 파일을 트리에서 옮기지 않고 바로가기로 고정할 수 있습니다.",
        "이름을 검증하고 `.md`를 자동 완성해 Markdown 파일과 폴더를 만들 수 있습니다.",
        "폴더나 루트에 파일을 끌어 놓으면 대상을 표시하고, 이동 성공 시에만 확인합니다.",
        "Markdown과 HTML 미리보기에서 데스크톱과 모바일에서 집중 읽기를 종료할 수 있습니다.",
        "삭제 후 5초 동안 실행 취소할 수 있고, 백업에 고정 메타데이터도 보존합니다.",
        "한영 빠른 가이드, 반응형 사이드바 조작, 좁은 화면용 도구 모음을 제공합니다.",
      ],
    })
  })
})
