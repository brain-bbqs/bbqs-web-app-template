import { readStorageItem, writeStorageItem } from "@brain-bbqs/utils";

// Also read before first paint by the script configs/vite.config.ts injects into index.html.
export const THEME_KEY = "web-app-template.theme";

export type ThemePreference = "light" | "dark";

/** The user's explicit light/dark choice, if they've ever used the header toggle. */
export function loadStoredTheme(): ThemePreference | null {
  const value = readStorageItem(THEME_KEY);
  return value === "light" || value === "dark" ? value : null;
}

export function saveStoredTheme(theme: ThemePreference): void {
  writeStorageItem(THEME_KEY, theme, (e) => console.warn("Could not save theme preference:", e));
}
