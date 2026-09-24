import { createChoiceStore } from "@brain-bbqs/utils";

// Also read before first paint by the script configs/vite.config.ts injects into index.html.
export const THEME_KEY = "web-app-template.theme";

export type ThemePreference = "light" | "dark";

const themeStore = createChoiceStore<ThemePreference>(THEME_KEY, ["light", "dark"], (e) =>
  console.warn("Could not save theme preference:", e),
);

/** The user's explicit light/dark choice, if they've ever used the header toggle. */
export function loadStoredTheme(): ThemePreference | null {
  return themeStore.load();
}

export function saveStoredTheme(theme: ThemePreference): void {
  themeStore.save(theme);
}
