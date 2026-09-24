// Also read before first paint by the script configs/vite.config.ts injects into index.html.
export const THEME_KEY = "web-app-template.theme";

export type ThemePreference = "light" | "dark";

/** The user's explicit light/dark choice, if they've ever used the header toggle. */
export function loadStoredTheme(): ThemePreference | null {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function saveStoredTheme(theme: ThemePreference): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    console.warn("Could not save theme preference:", e);
  }
}
