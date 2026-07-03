import { z } from "zod"

export const ThemePreference = {
  System: "system",
  Light: "light",
  Dark: "dark",
} as const

export type ThemePreference = (typeof ThemePreference)[keyof typeof ThemePreference]

const ThemePreferenceSchema = z.union([
  z.literal(ThemePreference.System),
  z.literal(ThemePreference.Light),
  z.literal(ThemePreference.Dark),
])

const themeStorageKey = "mding.theme"
const lightThemeColor = "#f7f7f4"
const darkThemeColor = "#111210"

export function readThemePreference(): ThemePreference {
  return ThemePreferenceSchema.catch(ThemePreference.System).parse(
    localStorage.getItem(themeStorageKey),
  )
}

export function saveThemePreference(preference: ThemePreference): void {
  localStorage.setItem(themeStorageKey, preference)
}

export function applyThemePreference(preference: ThemePreference): void {
  document.documentElement.setAttribute("data-theme", preference)
  updateThemeColor(preference)
}

function updateThemeColor(preference: ThemePreference): void {
  const themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (themeColorMeta === null) {
    return
  }

  themeColorMeta.content = resolvedThemeColor(preference)
}

function resolvedThemeColor(preference: ThemePreference): string {
  switch (preference) {
    case ThemePreference.Dark:
      return darkThemeColor
    case ThemePreference.Light:
      return lightThemeColor
    case ThemePreference.System:
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? darkThemeColor
        : lightThemeColor
  }
}
