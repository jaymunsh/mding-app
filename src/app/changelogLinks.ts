import type { AppLanguage } from "./i18n"

const repositoryUrl = "https://github.com/jaymunsh/mding-app/blob/main" as const

export function changelogUrl(language: AppLanguage): string {
  switch (language) {
    case "en":
      return `${repositoryUrl}/CHANGELOG.md`
    case "ko":
      return `${repositoryUrl}/CHANGELOG.ko.md`
  }
}
