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
}
